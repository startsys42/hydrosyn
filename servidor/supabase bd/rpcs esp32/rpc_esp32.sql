CREATE OR REPLACE FUNCTION get_pending_calibrations(
  p_system_name TEXT,
  p_esp_name TEXT,
  p_code TEXT
)
RETURNS TABLE (
  calibration_id BIGINT,
  pump_gpio INTEGER
 
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_system_id BIGINT;
  v_admin_id UUID;
  v_esp32_id BIGINT;
BEGIN
  
  SELECT s.id, s.admin INTO v_system_id, v_admin_id
  FROM systems s
  JOIN system_secrets ss ON ss.system = s.id
  JOIN admin_users au ON au.user = s.admin
  WHERE s.name = p_system_name
    AND ss.code = p_code
    AND au.is_active = true;  
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'System not found, invalid code, or inactive admin';
  END IF;
  
  
  SELECT e.id INTO v_esp32_id
  FROM esp32 e
  WHERE e.name = p_esp_name
    AND e.system = v_system_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'ESP32 not found in this system';
  END IF;
  
  
  RETURN QUERY
  SELECT 
    c.id,
    p.gpio
  FROM calibration c
  JOIN pumps p ON p.id = c.pump
  WHERE p.esp32 = v_esp32_id  
    AND c.success = false;
END;
$$;

CREATE OR REPLACE FUNCTION get_pending_manual_records(
  p_system_name TEXT,
  p_esp_name TEXT,
  p_code TEXT
)
RETURNS TABLE (
  record_id BIGINT,
  pump_gpio INTEGER,
  required_time_ms BIGINT       
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_system_id BIGINT;
  v_admin_id UUID;
  v_esp32_id BIGINT;
  v_calib_volume NUMERIC;
  v_calib_time INTEGER := 30; 
  v_record RECORD;
BEGIN
  
  
  
  SELECT s.id, s.admin INTO v_system_id, v_admin_id
  FROM systems s
  JOIN system_secrets ss ON ss.system = s.id
  WHERE s.name = p_system_name
    AND ss.code = p_code;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'System not found or invalid code';
  END IF;
  
  
  
  
  IF NOT EXISTS (
    SELECT 1 FROM admin_users 
    WHERE "user" = v_admin_id AND is_active = true
  ) THEN
    RAISE EXCEPTION 'System administrator is not active';
  END IF;
  
  
  
  
  SELECT e.id INTO v_esp32_id
  FROM esp32 e
  WHERE e.name = p_esp_name
    AND e.system = v_system_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'ESP32 not found in this system';
  END IF;
  
  
  
  
  FOR v_record IN
    SELECT 
      rp.id,
      rp.volume,
      rp.pump,
      p.gpio
     
    FROM records_pumps rp
    JOIN pumps p ON p.id = rp.pump
    
    WHERE p.esp32 = v_esp32_id
      AND rp.success = false
    ORDER BY rp.created_at ASC
  LOOP
    
    SELECT volume INTO v_calib_volume
    FROM calibrate
    WHERE pump = v_record.pump
    ORDER BY created_at DESC
    LIMIT 1;
    
    
    IF v_calib_volume IS NULL THEN
      RAISE EXCEPTION 'Pump with GPIO % has no previous calibration', v_record.gpio;
    END IF;
    
    
    
    
    record_id := v_record.id;
    pump_gpio := v_record.gpio;
  
    required_time_ms := (v_record.volume / v_calib_volume) * v_calib_time * 1000;
    
    RETURN NEXT;
  END LOOP;
  
  RETURN;
END;
$$;

CREATE OR REPLACE FUNCTION get_pending_programs(
  p_system_name TEXT,
  p_esp_name TEXT,
  p_code TEXT,
   p_esp_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
RETURNS TABLE (
  programming_id BIGINT,
  gpio INTEGER,
  required_time_ms BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_system_id BIGINT;
  v_admin_id UUID;
  v_esp32_id BIGINT;
  v_24h_atras TIMESTAMP := p_esp_time - INTERVAL '24 hours'; 
  v_calib_volume NUMERIC;
  v_calib_time INTEGER;
  v_record RECORD;
  v_fecha_programada TIMESTAMP;
  v_dow INTEGER;
    v_hoy DATE := p_esp_time::DATE;
  v_dias_atras INTEGER;
BEGIN
  
  
  
  SELECT s.id, s.admin INTO v_system_id, v_admin_id
  FROM systems s
  JOIN system_secrets ss ON ss.system = s.id
  WHERE s.name = p_system_name AND ss.code = p_code;
  
  IF NOT FOUND THEN 
    RAISE EXCEPTION 'System not found or invalid code';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM admin_users 
    WHERE "user" = v_admin_id AND is_active = true
  ) THEN
     RAISE EXCEPTION 'System administrator is not active';
  END IF;
  
  SELECT e.id INTO v_esp32_id
  FROM esp32 e
  WHERE e.name = p_esp_name AND e.system = v_system_id;
  
  IF NOT FOUND THEN 
    RAISE EXCEPTION 'ESP32 not found in this system';
  END IF;
  

  
  
  
  FOR v_record IN
    SELECT 
      pp.id, 
      pp.volume, 
      pp.pump, 
      pp.clock,
      pp.day_of_week,
      p.gpio,
      p.id AS pump_id
    FROM programming_pumps pp
    JOIN pumps p ON p.id = pp.pump
    WHERE p.esp32 = v_esp32_id
  LOOP
    
    
    
    SELECT volume INTO v_calib_volume
    FROM calibrate
    WHERE pump = v_record.pump_id
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF v_calib_volume IS NULL THEN
      RAISE EXCEPTION 'Pump with GPIO % has no previous calibration', v_record.gpio;
    END IF;
    
    
    SELECT EXTRACT(EPOCH FROM (c2.created_at - c1.created_at))::INTEGER INTO v_calib_time
    FROM (
      SELECT created_at, ROW_NUMBER() OVER (ORDER BY created_at DESC) as rn
      FROM calibrate
      WHERE pump = v_record.pump_id
      LIMIT 2
    ) c1
    JOIN (
      SELECT created_at, ROW_NUMBER() OVER (ORDER BY created_at DESC) as rn
      FROM calibrate
      WHERE pump = v_record.pump_id
      LIMIT 2
    ) c2 ON c1.rn = 2 AND c2.rn = 1;
    
    IF v_calib_time IS NULL THEN
      v_calib_time := 30;
    END IF;
    
    
    
    
    v_dow := CASE v_record.day_of_week
      WHEN 'Sunday' THEN 0
      WHEN 'Monday' THEN 1
      WHEN 'Tuesday' THEN 2
      WHEN 'Wednesday' THEN 3
      WHEN 'Thursday' THEN 4
      WHEN 'Friday' THEN 5
      WHEN 'Saturday' THEN 6
    END;
    
    
    
    
    FOR v_dias_atras IN 0..6 LOOP
      
      v_fecha_programada := (v_hoy - (v_dias_atras || ' days')::INTERVAL) + 
                            ((v_dow - EXTRACT(DOW FROM (v_hoy - (v_dias_atras || ' days')::INTERVAL)) + 7) % 7) * INTERVAL '1 day' + 
                            v_record.clock;
      
      
      
      
      IF v_fecha_programada BETWEEN v_24h_atras AND p_esp_time  THEN
        
        
        
        
        IF NOT EXISTS (
          SELECT 1 FROM executions_pumps ep
          WHERE ep.programming_id = v_record.id
            AND ep.executed_at >= v_fecha_programada - INTERVAL '1 minute'
            AND ep.executed_at <= v_fecha_programada + INTERVAL '59 minute' 
            AND ep.success = true
        ) THEN
          
          
          
          programming_id := v_record.id;
          gpio := v_record.gpio;
          required_time_ms := (v_record.volume / v_calib_volume) * v_calib_time * 1000;
          
          RETURN NEXT;
          EXIT; 
        END IF;
      END IF;
    END LOOP;
  END LOOP;
  
  RETURN;
END;
$$;


CREATE OR REPLACE FUNCTION complete_calibration(
  p_calibration_id BIGINT,
  p_esp_name TEXT,
  p_code TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_system_id BIGINT;
  v_admin_id UUID;
  v_esp32_id BIGINT;
  v_pump_id BIGINT;
BEGIN
  
  SELECT e.id, e.system, s.admin INTO v_esp32_id, v_system_id, v_admin_id
  FROM esp32 e
  JOIN systems s ON s.id = e.system
  JOIN system_secrets ss ON ss.system = s.id
  WHERE e.name = p_esp_name 
    AND ss.code = p_code;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'ESP32 not authorized or invalid code';
  END IF;
  
  
  IF NOT EXISTS (
    SELECT 1 FROM admin_users 
    WHERE "user" = v_admin_id AND is_active = true
  ) THEN
    RAISE EXCEPTION 'System administrator is not active';
  END IF;
  
  
  SELECT p.id INTO v_pump_id
  FROM calibration c
  JOIN pumps p ON p.id = c.pump
  WHERE c.id = p_calibration_id
    AND p.esp32 = v_esp32_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Calibration does not belong to this ESP32';
  END IF;
  
  
  UPDATE calibration 
  SET success = true 
  WHERE id = p_calibration_id;
  
  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION complete_manual_record(
  p_record_id BIGINT,
  p_esp_name TEXT,
  p_code TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_system_id BIGINT;
  v_admin_id UUID;
  v_esp32_id BIGINT;
  v_pump_id BIGINT;
BEGIN
  
  SELECT e.id, e.system, s.admin INTO v_esp32_id, v_system_id, v_admin_id
  FROM esp32 e
  JOIN systems s ON s.id = e.system
  JOIN system_secrets ss ON ss.system = s.id
  WHERE e.name = p_esp_name AND ss.code = p_code;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'ESP32 not authorized or invalid code';
  END IF;
  
  
  IF NOT EXISTS (
    SELECT 1 FROM admin_users WHERE "user" = v_admin_id AND is_active = true
  ) THEN
    RAISE EXCEPTION 'System administrator is not active';
  END IF;
  
  
  SELECT p.id INTO v_pump_id
  FROM records_pumps rp
  JOIN pumps p ON p.id = rp.pump
  WHERE rp.id = p_record_id AND p.esp32 = v_esp32_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Record does not belong to this ESP32';
  END IF;
  
  
  UPDATE records_pumps SET success = true WHERE id = p_record_id;
  RETURN FOUND;
END;
$$;


CREATE OR REPLACE FUNCTION register_execution(
  p_programming_id BIGINT,
  p_esp_name TEXT,
  p_code TEXT,
  p_success BOOLEAN DEFAULT true
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_system_id BIGINT;
  v_admin_id UUID;
  v_esp32_id BIGINT;
  v_pump_id BIGINT;
   v_volume NUMERIC; 
BEGIN
  
  SELECT e.id, e.system, s.admin INTO v_esp32_id, v_system_id, v_admin_id
  FROM esp32 e
  JOIN systems s ON s.id = e.system
  JOIN system_secrets ss ON ss.system = s.id
  WHERE e.name = p_esp_name AND ss.code = p_code;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'ESP32 not authorized or invalid code';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM admin_users WHERE "user" = v_admin_id AND is_active = true
  ) THEN
    RAISE EXCEPTION 'System administrator is not active';
  END IF;
  
     SELECT p.id, pp.volume INTO v_pump_id, v_volume 
  FROM programming_pumps pp
  JOIN pumps p ON p.id = pp.pump
  WHERE pp.id = p_programming_id AND p.esp32 = v_esp32_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Program does not belong to this ESP32';
  END IF;
  
  INSERT INTO executions_pumps (programming_id, success)
  VALUES (p_programming_id, p_success);

    
  
  
  IF p_success THEN
    INSERT INTO records_pumps (
      pump,
      volume,
      "user",
      success
    )
    VALUES (
      v_pump_id,
      v_volume,
      v_admin_id,
      true
    );
  END IF;

  RETURN true;
END;
$$;




CREATE OR REPLACE FUNCTION get_pending_light_events(
    p_system_name TEXT,
    p_esp_name TEXT,
    p_code TEXT,
    p_esp_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
RETURNS TABLE (
    light_id BIGINT,
    gpio INTEGER,
    action SMALLINT,
    scheduled_at TIMESTAMP
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_system_id BIGINT;
    v_admin_id UUID;
    v_esp32_id BIGINT;
    v_esp_time TIMESTAMP := p_esp_time;
    v_today DATE := p_esp_time::DATE;
    v_dow INTEGER := EXTRACT(DOW FROM v_esp_time);
    v_now TIME := v_esp_time::time;
    v_start_time TIME;
    v_end_time TIME;
    v_is_active BOOLEAN;
    r RECORD;
BEGIN
    
    SELECT s.id, s.admin INTO v_system_id, v_admin_id
    FROM systems s
    JOIN system_secrets ss ON ss.system = s.id
    WHERE s.name = p_system_name AND ss.code = p_code;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid system or code';
    END IF;

    
    IF NOT EXISTS (SELECT 1 FROM admin_users WHERE "user" = v_admin_id AND is_active = true) THEN
        RAISE EXCEPTION 'Admin inactive';
    END IF;

    
    SELECT e.id INTO v_esp32_id
    FROM esp32 e
    WHERE e.name = p_esp_name AND e.system = v_system_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'ESP32 not found';
    END IF;

    
    FOR r IN 
        SELECT l.id, l.gpio
        FROM lights l
        WHERE l.esp32 = v_esp32_id
    LOOP
        light_id := r.id;
        gpio := r.gpio;
        
        
        SELECT pl.start_time, pl.end_time, pl.is_active 
        INTO v_start_time, v_end_time, v_is_active
        FROM programming_lights pl
        WHERE pl.light = light_id
          AND pl.day_of_week = (
              CASE v_dow
                  WHEN 1 THEN 'Monday'::day_of_week
                  WHEN 2 THEN 'Tuesday'::day_of_week
                  WHEN 3 THEN 'Wednesday'::day_of_week
                  WHEN 4 THEN 'Thursday'::day_of_week
                  WHEN 5 THEN 'Friday'::day_of_week
                  WHEN 6 THEN 'Saturday'::day_of_week
                  WHEN 0 THEN 'Sunday'::day_of_week
              END
          )
        ORDER BY pl.start_time DESC
        LIMIT 1;
        
        
        IF v_start_time IS NOT NULL THEN
            
            IF v_now >= v_start_time AND v_now <= v_end_time THEN
                
                IF v_is_active = false THEN
                    action := 1;
                    scheduled_at := (v_today::TIMESTAMP + v_start_time);
                    RETURN NEXT;
                END IF;
            
            ELSE
                
                IF v_is_active = true THEN
                    action := 0;
                    scheduled_at := (v_today::TIMESTAMP + v_end_time);
                    RETURN NEXT;
                END IF;
            END IF;
        END IF;
    END LOOP;
    
    RETURN;
END;
$$;


CREATE OR REPLACE FUNCTION register_light_event(
    p_light_id BIGINT,
    p_action SMALLINT,
    p_esp_name TEXT,
    p_code TEXT,
    p_scheduled_at TIMESTAMP
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_system_id BIGINT;
    v_admin_id UUID;
    v_esp32_id BIGINT;
    v_programming_id BIGINT;
    v_margin INTERVAL := INTERVAL '30 minutes';  
BEGIN
    
    IF p_action NOT IN (0,1) THEN
        RAISE EXCEPTION 'Invalid action: must be 0 (OFF) or 1 (ON)';
    END IF;

    
    SELECT s.id, s.admin INTO v_system_id, v_admin_id
    FROM systems s
    JOIN system_secrets ss ON ss.system = s.id
    JOIN esp32 e ON e.system = s.id
    WHERE e.name = p_esp_name
      AND ss.code = p_code;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'ESP32 not authorized or invalid code';
    END IF;

    
    IF NOT EXISTS (
        SELECT 1 FROM admin_users 
        WHERE "user" = v_admin_id AND is_active = true
    ) THEN
        RAISE EXCEPTION 'System administrator is not active';
    END IF;

    
    SELECT id INTO v_esp32_id
    FROM lights
    WHERE id = p_light_id
      AND system = v_system_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Light does not belong to this system';
    END IF;

    
    INSERT INTO lights_history(light_id, action, created_at)
    VALUES (p_light_id, p_action, p_scheduled_at);

    
    SELECT id INTO v_programming_id
    FROM programming_lights
    WHERE light = p_light_id
      AND day_of_week::text = TRIM(TO_CHAR(p_scheduled_at, 'Day'))
      AND (
          (p_action = 1 AND ABS(EXTRACT(EPOCH FROM (start_time - p_scheduled_at::time))) <= 1800) OR  
          (p_action = 0 AND ABS(EXTRACT(EPOCH FROM (end_time - p_scheduled_at::time))) <= 1800)
      )
    LIMIT 1;

    
    IF v_programming_id IS NOT NULL THEN
        UPDATE programming_lights
        SET is_active = (p_action = 1)
        WHERE id = v_programming_id;
    END IF;

    RETURN true;
END;
$$;