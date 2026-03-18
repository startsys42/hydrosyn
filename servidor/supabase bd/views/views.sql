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
  -- 1. Verificar que el sistema existe, el código es correcto y el admin está activo
  SELECT s.id, s.admin INTO v_system_id, v_admin_id
  FROM systems s
  JOIN system_secrets ss ON ss.system = s.id
  JOIN admin_users au ON au.user = s.admin
  WHERE s.name = p_system_name
    AND ss.code = p_code
    AND au.is_active = true;  -- Verificar que el admin esté activo
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'System not found, invalid code, or inactive admin';
  END IF;
  
  -- 2. Verificar que el ESP32 existe y pertenece al sistema
  SELECT e.id INTO v_esp32_id
  FROM esp32 e
  WHERE e.name = p_esp_name
    AND e.system = v_system_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'ESP32 not found in this system';
  END IF;
  
  -- 3. Devolver las calibraciones pendientes
  RETURN QUERY
  SELECT 
    c.id,
    p.gpio
  FROM calibration c
  JOIN pumps p ON p.id = c.pump
  WHERE p.esp32 = v_esp32_id  -- Filtramos por el ESP32 verificado
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
  required_time_ms BIGINT       -- Tiempo calculado en milisegundos
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_system_id BIGINT;
  v_admin_id UUID;
  v_esp32_id BIGINT;
  v_calib_volume NUMERIC;
  v_calib_time INTEGER := 30; -- Por defecto 30 segundos de calibración
  v_record RECORD;
BEGIN
  -- =============================================
  -- VALIDACIÓN 1: Sistema existe y código correcto
  -- =============================================
  SELECT s.id, s.admin INTO v_system_id, v_admin_id
  FROM systems s
  JOIN system_secrets ss ON ss.system = s.id
  WHERE s.name = p_system_name
    AND ss.code = p_code;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'System not found or invalid code';
  END IF;
  
  -- =============================================
  -- VALIDACIÓN 2: Admin del sistema está activo
  -- =============================================
  IF NOT EXISTS (
    SELECT 1 FROM admin_users 
    WHERE "user" = v_admin_id AND is_active = true
  ) THEN
    RAISE EXCEPTION 'System administrator is not active';
  END IF;
  
  -- =============================================
  -- VALIDACIÓN 3: ESP32 existe y pertenece al sistema
  -- =============================================
  SELECT e.id INTO v_esp32_id
  FROM esp32 e
  WHERE e.name = p_esp_name
    AND e.system = v_system_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'ESP32 not found in this system';
  END IF;
  
  -- =============================================
  -- DEVOLVER RECORDS PENDIENTES CON CÁLCULO DE TIEMPO
  -- =============================================
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
    -- Obtener la última calibración para esta bomba
    SELECT volume INTO v_calib_volume
    FROM calibrate
    WHERE pump = v_record.pump
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Si no hay calibración, usar valores por defecto o lanzar error
    IF v_calib_volume IS NULL THEN
      RAISE EXCEPTION 'Pump with GPIO % has no previous calibration', v_record.gpio;
    END IF;
    
    -- Calcular tiempo necesario
    -- Fórmula: (volumen_solicitado / volumen_calibracion) * tiempo_calibracion * 1000 (para ms)
    -- Ejemplo: (2 litros / 1 litro) * 30 segundos = 60 segundos = 60000 ms
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
  p_code TEXT
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
  v_24h_atras TIMESTAMP;
  v_calib_volume NUMERIC;
  v_calib_time INTEGER;
  v_record RECORD;
  v_fecha_programada TIMESTAMP;
  v_dow INTEGER;
  v_hoy DATE;
  v_dias_atras INTEGER;
BEGIN
  -- =============================================
  -- VALIDACIONES (igual que en las otras funciones)
  -- =============================================
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
  
  -- =============================================
  -- DEFINIR VENTANA DE TIEMPO: ÚLTIMAS 24 HORAS
  -- =============================================
  v_24h_atras := CURRENT_TIMESTAMP - INTERVAL '24 hours';
  v_hoy := CURRENT_DATE;
  
  -- =============================================
  -- RECORRER TODAS LAS PROGRAMACIONES DEL ESP32
  -- =============================================
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
    -- =============================================
    -- OBTENER CALIBRACIÓN (igual que en manual_records)
    -- =============================================
    SELECT volume INTO v_calib_volume
    FROM calibrate
    WHERE pump = v_record.pump_id
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF v_calib_volume IS NULL THEN
      RAISE EXCEPTION 'Pump with GPIO % has no previous calibration', v_record.gpio;
    END IF;
    
    -- Obtener tiempo de calibración
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
    
    -- =============================================
    -- PASO 1: Convertir day_of_week a número
    -- =============================================
    v_dow := CASE v_record.day_of_week
      WHEN 'Sunday' THEN 0
      WHEN 'Monday' THEN 1
      WHEN 'Tuesday' THEN 2
      WHEN 'Wednesday' THEN 3
      WHEN 'Thursday' THEN 4
      WHEN 'Friday' THEN 5
      WHEN 'Saturday' THEN 6
    END;
    
    -- =============================================
    -- PASO 2: Buscar en los ÚLTIMOS 7 DÍAS
    -- =============================================
    FOR v_dias_atras IN 0..6 LOOP
      -- Calcular fecha para este día específico
      v_fecha_programada := (v_hoy - (v_dias_atras || ' days')::INTERVAL) + 
                            ((v_dow - EXTRACT(DOW FROM (v_hoy - (v_dias_atras || ' days')::INTERVAL)) + 7) % 7) * INTERVAL '1 day' + 
                            v_record.clock;
      
      -- =============================================
      -- PASO 3: Verificar si esta ocurrencia está en las ÚLTIMAS 24 HORAS
      -- =============================================
      IF v_fecha_programada BETWEEN v_24h_atras AND CURRENT_TIMESTAMP THEN
        
        -- =============================================
        -- PASO 4: Verificar si YA SE EJECUTÓ CON ÉXITO
        -- =============================================
        IF NOT EXISTS (
          SELECT 1 FROM executions_pumps ep
          WHERE ep.programming_id = v_record.id
            AND ep.executed_at >= v_fecha_programada - INTERVAL '1 minute'
            AND ep.executed_at <= v_fecha_programada + INTERVAL '59 minute' -- Margen de 1 hora
            AND ep.success = true
        ) THEN
          -- =============================================
          -- PASO 5: Esta programación NO se ejecutó → DEVOLVER
          -- =============================================
          programming_id := v_record.id;
          gpio := v_record.gpio;
          required_time_ms := (v_record.volume / v_calib_volume) * v_calib_time * 1000;
          
          RETURN NEXT;
          EXIT; -- Salir del bucle de días, pasamos a la siguiente programación
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
  -- 1. Obtener el sistema y admin asociados al ESP32
  SELECT e.id, e.system, s.admin INTO v_esp32_id, v_system_id, v_admin_id
  FROM esp32 e
  JOIN systems s ON s.id = e.system
  JOIN system_secrets ss ON ss.system = s.id
  WHERE e.name = p_esp_name 
    AND ss.code = p_code;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'ESP32 not authorized or invalid code';
  END IF;
  
  -- 2. Verificar que el admin del sistema está activo
  IF NOT EXISTS (
    SELECT 1 FROM admin_users 
    WHERE "user" = v_admin_id AND is_active = true
  ) THEN
    RAISE EXCEPTION 'System administrator is not active';
  END IF;
  
  -- 3. Verificar que la calibración pertenece a una bomba de este ESP32
  SELECT p.id INTO v_pump_id
  FROM calibration c
  JOIN pumps p ON p.id = c.pump
  WHERE c.id = p_calibration_id
    AND p.esp32 = v_esp32_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Calibration does not belong to this ESP32';
  END IF;
  
  -- 4. Actualizar la calibración
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
  -- 1. Verificar ESP32
  SELECT e.id, e.system, s.admin INTO v_esp32_id, v_system_id, v_admin_id
  FROM esp32 e
  JOIN systems s ON s.id = e.system
  JOIN system_secrets ss ON ss.system = s.id
  WHERE e.name = p_esp_name AND ss.code = p_code;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'ESP32 not authorized or invalid code';
  END IF;
  
  -- 2. Verificar admin activo
  IF NOT EXISTS (
    SELECT 1 FROM admin_users WHERE "user" = v_admin_id AND is_active = true
  ) THEN
    RAISE EXCEPTION 'System administrator is not active';
  END IF;
  
  -- 3. Verificar pertenencia
  SELECT p.id INTO v_pump_id
  FROM records_pumps rp
  JOIN pumps p ON p.id = rp.pump
  WHERE rp.id = p_record_id AND p.esp32 = v_esp32_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Record does not belong to this ESP32';
  END IF;
  
  -- 4. Actualizar
  UPDATE records_pumps SET success = true WHERE id = p_record_id;
  RETURN FOUND;
END;
$$;

-- Para registrar ejecuciones
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
BEGIN
  -- Mismas validaciones...
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
  FROM programming_pumps pp
  JOIN pumps p ON p.id = pp.pump
  WHERE pp.id = p_programming_id AND p.esp32 = v_esp32_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Program does not belong to this ESP32';
  END IF;
  
  INSERT INTO executions_pumps (programming_id, success)
  VALUES (p_programming_id, p_success);
  RETURN true;
END;
$$;



void checkCalibrationRPC() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;

  String url = String(supabaseUrl) + "/rest/v1/rpc/get_pending_calibration";

  http.begin(url);

  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", supabaseKey);
  http.addHeader("Authorization", "Bearer " + String(supabaseKey));

  // 🔥 IMPORTANTE: body JSON
  String body = "{";
  body += "\"p_system_name\":\"" + String(SYSTEM_NAME) + "\",";
  body += "\"p_esp_name\":\"" + String(ESP_NAME) + "\",";
  body += "\"p_code\":\"" + String(ESP_CODE) + "\"";
  body += "}";

  int httpCode = http.POST(body);

  if (httpCode == 200) {
    String payload = http.getString();
    Serial.println("Respuesta:");
    Serial.println(payload);

    if (payload != "[]") {
      activarBomba();
    }
  } else {
    Serial.print("Error HTTP: ");
    Serial.println(httpCode);
  }

  http.end();
}
