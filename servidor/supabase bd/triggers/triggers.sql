

CREATE OR REPLACE FUNCTION prevent_multiple_roles()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    
    IF (SELECT COUNT(*) FROM public.roles) >= 1 THEN
      RAISE EXCEPTION 'Only one user is allowed in roles';
    END IF;
  ELSIF (TG_OP = 'UPDATE') THEN
    RAISE EXCEPTION 'UPDATE is not allowed on roles';
  ELSIF (TG_OP = 'DELETE') THEN
    RAISE EXCEPTION 'DELETE is not allowed on roles';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_roles_lock
BEFORE INSERT OR UPDATE OR DELETE ON public.roles
FOR EACH ROW EXECUTE FUNCTION prevent_multiple_roles();


CREATE OR REPLACE FUNCTION check_systems_limit()
RETURNS TRIGGER AS $$
DECLARE
  has_role BOOLEAN;
  existing_count INT;
BEGIN
  
  SELECT EXISTS (
    SELECT 1 FROM public.roles r WHERE r.user = NEW.admin
  ) INTO has_role;

  IF NOT has_role THEN
    
    SELECT COUNT(*)
    FROM public.systems s
    WHERE s.admin = NEW.admin
    INTO existing_count;

    IF existing_count >= 2 THEN
      RAISE EXCEPTION 'This user cannot have more than 2 systems';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER trg_check_systems_limit
BEFORE INSERT ON public.systems
FOR EACH ROW
EXECUTE FUNCTION check_systems_limit();


CREATE OR REPLACE FUNCTION prevent_insert_duplicate_name()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.systems s
    WHERE s.admin = NEW.admin
      AND s.name = (NEW.name)
  ) THEN
    RAISE EXCEPTION 'Cannot insert: this admin already has a system with this name';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER trg_prevent_insert_duplicate_name
BEFORE INSERT ON public.systems
FOR EACH ROW
EXECUTE FUNCTION prevent_insert_duplicate_name();


CREATE OR REPLACE FUNCTION prevent_update_duplicate_name()
RETURNS TRIGGER AS $$
BEGIN
  
  IF NEW.name IS DISTINCT FROM OLD.name THEN
    IF EXISTS (
      SELECT 1
      FROM public.systems s
      WHERE s.admin = NEW.admin
        AND s.name= NEW.name
        AND s.id <> OLD.id 
    ) THEN
      RAISE EXCEPTION 'Cannot update: this admin already has another system with this name';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER trg_prevent_update_duplicate_name
BEFORE UPDATE ON public.systems
FOR EACH ROW
EXECUTE FUNCTION prevent_update_duplicate_name();


CREATE OR REPLACE FUNCTION limit_users_for_non_roles_admin()
RETURNS TRIGGER AS $$
DECLARE
  admin_user uuid;
  total_users int;
BEGIN
  
  SELECT s.admin INTO admin_user
  FROM public.systems s
  WHERE s.id = NEW.system;

 
  IF NOT EXISTS (SELECT 1 FROM public.roles r WHERE r.user = admin_user) THEN
    
    SELECT COUNT(DISTINCT su.user_id)
    INTO total_users
    FROM public.systems_users su
    JOIN public.systems s2 ON su.system = s2.id
    WHERE s2.admin = admin_user;

    
    IF total_users >= 5 THEN
      RAISE EXCEPTION 'This admin cannot have more than 5 distinct users across all their systems';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER trg_limit_users_for_non_roles_admin
BEFORE INSERT OR UPDATE ON public.systems_users
FOR EACH ROW
EXECUTE FUNCTION limit_users_for_non_roles_admin();


CREATE OR REPLACE FUNCTION prevent_duplicate_esp32_name_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.esp32 e
    WHERE e.system = NEW.system
      AND e.name = NEW.name
  ) THEN
    RAISE EXCEPTION 'Cannot insert: this system already has an ESP32 with this name';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_duplicate_esp32_name_insert
BEFORE INSERT ON public.esp32
FOR EACH ROW
EXECUTE FUNCTION prevent_duplicate_esp32_name_insert();


CREATE OR REPLACE FUNCTION prevent_duplicate_esp32_name_update()
RETURNS TRIGGER AS $$
BEGIN
  
  IF NEW.name IS DISTINCT FROM OLD.name THEN
    IF EXISTS (
      SELECT 1
      FROM public.esp32 e
      WHERE e.system = NEW.system
        AND e.name = NEW.name
        AND e.id <> OLD.id
    ) THEN
      RAISE EXCEPTION 'Cannot update: this system already has another ESP32 with this name';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_duplicate_esp32_name_update
BEFORE UPDATE ON public.esp32
FOR EACH ROW
EXECUTE FUNCTION prevent_duplicate_esp32_name_update();


CREATE OR REPLACE FUNCTION check_esp32_limit()
RETURNS TRIGGER AS $$
DECLARE
  admin_user uuid;
  has_role BOOLEAN;
  existing_count INT;
BEGIN
 
  SELECT s.admin INTO admin_user
  FROM public.systems s
  WHERE s.id = NEW.system;


  SELECT EXISTS (
    SELECT 1 FROM public.roles r WHERE r.user = admin_user
  ) INTO has_role;

 
  IF NOT has_role THEN
   
    SELECT COUNT(*)
    FROM public.esp32 e
    WHERE e.system = NEW.system
    INTO existing_count;


    IF existing_count >= 2 THEN
      RAISE EXCEPTION 'This system cannot have more than 2 ESP32 ';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER trg_check_esp32_limit
BEFORE INSERT ON public.esp32
FOR EACH ROW
EXECUTE FUNCTION check_esp32_limit();


CREATE OR REPLACE FUNCTION prevent_multiple_secrets_insert()
RETURNS TRIGGER AS $$
BEGIN

  IF EXISTS (
    SELECT 1
    FROM public.system_secrets ss
    WHERE ss.system = NEW.system
  ) THEN
    RAISE EXCEPTION 'This system already has a secret assigned';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_multiple_secrets_insert
BEFORE INSERT ON public.system_secrets
FOR EACH ROW
EXECUTE FUNCTION prevent_multiple_secrets_insert();


CREATE OR REPLACE FUNCTION validate_secret_update()
RETURNS TRIGGER AS $$
BEGIN
  
  IF NEW.system IS DISTINCT FROM OLD.system THEN
    RAISE EXCEPTION 'Cannot change system for an existing secret';
  END IF;

  
  IF length(NEW.code) < 10 OR length(NEW.code) > 30 THEN
    RAISE EXCEPTION 'Code must be between 10 and 30 characters long';
  END IF;

  
  IF NEW.code !~ '^[A-Za-z0-9]+$' THEN
    RAISE EXCEPTION 'Code must contain only alphanumeric characters';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_secret_update
BEFORE UPDATE ON public.system_secrets
FOR EACH ROW
EXECUTE FUNCTION validate_secret_update();

CREATE OR REPLACE FUNCTION prevent_duplicate_secret_per_user()
RETURNS TRIGGER AS $$
DECLARE
    admin_id uuid;
BEGIN
 
    SELECT s.admin INTO admin_id
    FROM public.systems s
    WHERE s.id = NEW.system;


    IF EXISTS (
        SELECT 1
        FROM public.system_secrets ss
        JOIN public.systems s2 ON ss.system = s2.id
        WHERE s2.admin = admin_id
          AND ss.code = NEW.code
    ) THEN
        RAISE EXCEPTION 'This code is already used in another system of the same user';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_duplicate_secret_per_user
BEFORE INSERT ON public.system_secrets
FOR EACH ROW
EXECUTE FUNCTION prevent_duplicate_secret_per_user();




CREATE OR REPLACE FUNCTION check_tanks_limit()
RETURNS TRIGGER AS $$
DECLARE
  admin_user uuid;
  has_role BOOLEAN;
  existing_count INT;
BEGIN

  SELECT s.admin INTO admin_user
  FROM public.systems s
  WHERE s.id = NEW.system;

 
  SELECT EXISTS (
    SELECT 1 FROM public.roles r WHERE r.user = admin_user
  ) INTO has_role;


  IF NOT has_role THEN
    SELECT COUNT(*) INTO existing_count
    FROM public.tanks t
    WHERE t.system = NEW.system;

    IF existing_count >= 20 THEN
      RAISE EXCEPTION 'This system cannot have more than 20 tanks';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_tanks_limit
BEFORE INSERT ON public.tanks
FOR EACH ROW
EXECUTE FUNCTION check_tanks_limit();


CREATE OR REPLACE FUNCTION prevent_duplicate_tank_name_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.tanks t
    WHERE t.system = NEW.system
      AND t.name = NEW.name
  ) THEN
    RAISE EXCEPTION 'Cannot insert: this system already has a tank with this name';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_duplicate_tank_name_insert
BEFORE INSERT ON public.tanks
FOR EACH ROW
EXECUTE FUNCTION prevent_duplicate_tank_name_insert();


CREATE OR REPLACE FUNCTION prevent_duplicate_tank_name_update()
RETURNS TRIGGER AS $$
BEGIN

  IF NEW.name IS DISTINCT FROM OLD.name THEN
    IF EXISTS (
      SELECT 1
      FROM public.tanks t
      WHERE t.system = NEW.system
        AND t.name = NEW.name
        AND t.id <> OLD.id
    ) THEN
      RAISE EXCEPTION 'Cannot update: this system already has another tank with this name';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_duplicate_tank_name_update
BEFORE UPDATE ON public.tanks
FOR EACH ROW
EXECUTE FUNCTION prevent_duplicate_tank_name_update();


CREATE OR REPLACE FUNCTION prevent_manual_secret_delete()
RETURNS trigger AS $$
BEGIN

    IF EXISTS (SELECT 1 FROM systems WHERE id = OLD.system) THEN
        RAISE EXCEPTION 'Cannot delete a secret manually while its system exists';
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_manual_secret_delete_trigger
BEFORE DELETE ON system_secrets
FOR EACH ROW
EXECUTE FUNCTION prevent_manual_secret_delete();


CREATE OR REPLACE FUNCTION deactivate_system_users()
RETURNS trigger AS $$
BEGIN
    
    IF OLD.is_active = TRUE AND NEW.is_active = FALSE THEN
        
        UPDATE systems_users su
        SET is_active = FALSE
        FROM systems s
        WHERE s.admin = NEW.user
          AND su.system = s.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER trigger_deactivate_system_users
AFTER UPDATE ON admin_users
FOR EACH ROW
WHEN (OLD.is_active IS DISTINCT FROM NEW.is_active)
EXECUTE FUNCTION deactivate_system_users();




CREATE OR REPLACE FUNCTION prevent_duplicate_pump_name_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.pumps p
    WHERE p.system = NEW.system
      AND p.name = NEW.name
  ) THEN
    RAISE EXCEPTION 'Cannot insert: this system already has a pump  with this name';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_duplicate_pump_name_insert
BEFORE INSERT ON public.pumps
FOR EACH ROW
EXECUTE FUNCTION prevent_duplicate_pump_name_insert();


CREATE OR REPLACE FUNCTION prevent_duplicate_pump_name_update()
RETURNS TRIGGER AS $$
BEGIN

  IF NEW.name IS DISTINCT FROM OLD.name THEN
    IF EXISTS (
      SELECT 1
      FROM public.pumps p
      WHERE p.system = NEW.system
        AND p.name = NEW.name
        AND p.id <> OLD.id
    ) THEN
      RAISE EXCEPTION 'Cannot update: this system already has another pump with this name';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_duplicate_pump_name_update
BEFORE UPDATE ON public.pumps
FOR EACH ROW
EXECUTE FUNCTION prevent_duplicate_pump_name_update();




CREATE OR REPLACE FUNCTION validate_pump_esp32_system()
RETURNS TRIGGER AS $$
DECLARE
    esp_system bigint;
BEGIN
  
    SELECT system INTO esp_system FROM esp32 WHERE id = NEW.esp32;

    IF esp_system IS NULL THEN
        RAISE EXCEPTION 'ESP32 not found in this system';
    END IF;

    IF esp_system != NEW.system THEN
        RAISE EXCEPTION 'ESP32 and Pump must belong to the same system';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER check_pump_esp32_system
BEFORE INSERT OR UPDATE ON pumps
FOR EACH ROW
EXECUTE FUNCTION validate_pump_esp32_system();






CREATE FUNCTION check_records_user() RETURNS trigger AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM public.tanks t
        JOIN public.systems s ON s.id = t.system
        JOIN public.admin_users a ON a."user" = s.admin
        WHERE t.id = NEW.tank
          AND a.is_active = true
          AND (
                NEW."user" = s.admin
                OR EXISTS (
                    SELECT 1
                    FROM public.systems_users su
                    WHERE su.system = s.id
                      AND su.is_active = true
                      AND su.user_id = NEW."user"
                )
          )
    ) THEN
        RAISE EXCEPTION 'User is not authorized for this tank or admin inactive';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_records_user
BEFORE INSERT OR UPDATE ON public.records
FOR EACH ROW EXECUTE FUNCTION check_records_user();


CREATE OR REPLACE FUNCTION check_lights_limit()
RETURNS TRIGGER AS $$
DECLARE
    light_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO light_count
    FROM public.lights
    WHERE system = NEW.system;
    
    IF light_count >= 6 THEN
        RAISE EXCEPTION 'Each system can only have a maximum of 6 lights. Currently has % lights.', light_count;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_lights_limit
    BEFORE INSERT ON public.lights
    FOR EACH ROW
    EXECUTE FUNCTION check_lights_limit();


CREATE OR REPLACE FUNCTION check_gpio_not_used_by_pump()
RETURNS TRIGGER AS $$
DECLARE
    pump_exists BOOLEAN;
BEGIN
    SELECT EXISTS(
        SELECT 1 
        FROM public.pumps 
        WHERE esp32 = NEW.esp32 AND gpio = NEW.gpio
    ) INTO pump_exists;
    
    IF pump_exists THEN
        RAISE EXCEPTION 'GPIO % is already used by a pump on ESP32 %. Cannot use the same pin for a light.', NEW.gpio, NEW.esp32;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_gpio_not_used_by_pump
    BEFORE INSERT OR UPDATE ON public.lights
    FOR EACH ROW
    EXECUTE FUNCTION check_gpio_not_used_by_pump();


CREATE OR REPLACE FUNCTION check_gpio_not_used_by_light()
RETURNS TRIGGER AS $$
DECLARE
    light_exists BOOLEAN;
BEGIN
    SELECT EXISTS(
        SELECT 1 
        FROM public.lights 
        WHERE esp32 = NEW.esp32 AND gpio = NEW.gpio
    ) INTO light_exists;
    
    IF light_exists THEN
        RAISE EXCEPTION 'GPIO % is already used by a light on ESP32 %. Cannot use the same pin for a pump.', NEW.gpio, NEW.esp32;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


DROP TRIGGER IF EXISTS trg_check_gpio_not_used_by_light ON public.pumps;
CREATE TRIGGER trg_check_gpio_not_used_by_light
    BEFORE INSERT OR UPDATE ON public.pumps
    FOR EACH ROW
    EXECUTE FUNCTION check_gpio_not_used_by_light();


CREATE OR REPLACE FUNCTION validate_light_esp32_system()
RETURNS TRIGGER AS $$
DECLARE
    esp_system BIGINT;
BEGIN
    SELECT system INTO esp_system FROM public.esp32 WHERE id = NEW.esp32;
    
    IF esp_system IS NULL THEN
        RAISE EXCEPTION 'ESP32 not found';
    END IF;
    
    IF esp_system != NEW.system THEN
        RAISE EXCEPTION 'ESP32 and Light must belong to the same system';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_light_esp32_system
    BEFORE INSERT OR UPDATE ON public.lights
    FOR EACH ROW
    EXECUTE FUNCTION validate_light_esp32_system();


CREATE OR REPLACE FUNCTION prevent_duplicate_light_name_insert()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM public.lights l
        WHERE l.system = NEW.system
          AND l.name = NEW.name
    ) THEN
        RAISE EXCEPTION 'Cannot insert: this system already has a light with this name';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_duplicate_light_name_insert
    BEFORE INSERT ON public.lights
    FOR EACH ROW
    EXECUTE FUNCTION prevent_duplicate_light_name_insert();


CREATE OR REPLACE FUNCTION prevent_duplicate_light_name_update()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.name IS DISTINCT FROM OLD.name THEN
        IF EXISTS (
            SELECT 1
            FROM public.lights l
            WHERE l.system = NEW.system
              AND l.name = NEW.name
              AND l.id <> OLD.id
        ) THEN
            RAISE EXCEPTION 'Cannot update: this system already has another light with this name';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_duplicate_light_name_update
    BEFORE UPDATE ON public.lights
    FOR EACH ROW
    EXECUTE FUNCTION prevent_duplicate_light_name_update();


    

CREATE OR REPLACE FUNCTION check_light_schedule_overlap()
RETURNS TRIGGER AS $$
DECLARE
    overlapping_schedule RECORD;
BEGIN
    
    SELECT * INTO overlapping_schedule
    FROM public.programming_lights
    WHERE light = NEW.light
      AND day_of_week = NEW.day_of_week
      AND id IS DISTINCT FROM NEW.id  
      AND (
          
          (NEW.start_time >= start_time AND NEW.start_time < end_time)
          OR
          
          (NEW.end_time > start_time AND NEW.end_time <= end_time)
          OR
          
          (NEW.start_time <= start_time AND NEW.end_time >= end_time)
      );
    
    
    IF FOUND THEN
        RAISE EXCEPTION 'Cannot create/update schedule: Overlaps with existing schedule from % to % on %', 
            overlapping_schedule.start_time, 
            overlapping_schedule.end_time,
            overlapping_schedule.day_of_week;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER trg_check_light_schedule_overlap
    BEFORE INSERT OR UPDATE ON public.programming_lights
    FOR EACH ROW
    EXECUTE FUNCTION check_light_schedule_overlap();

    


CREATE OR REPLACE FUNCTION record_light_history()
RETURNS TRIGGER AS $$
BEGIN
    
    IF NEW.is_active IS DISTINCT FROM OLD.is_active THEN
        INSERT INTO public.lights_history (light_id, action)
        VALUES (
            NEW.light, 
            CASE WHEN NEW.is_active THEN 1 ELSE 0 END
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER trigger_record_light_history
    AFTER UPDATE OF is_active ON public.programming_lights
    FOR EACH ROW
    EXECUTE FUNCTION record_light_history();

    CREATE OR REPLACE FUNCTION check_lights_limit_update()
RETURNS TRIGGER AS $$
DECLARE
    light_count INTEGER;
BEGIN
    
    IF NEW.system IS DISTINCT FROM OLD.system THEN
        SELECT COUNT(*) INTO light_count
        FROM public.lights
        WHERE system = NEW.system;
        
        IF light_count >= 6 THEN
            RAISE EXCEPTION 'Each system can only have a maximum of 6 lights. Currently has % lights.', light_count;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_lights_limit_update
    BEFORE UPDATE ON public.lights
    FOR EACH ROW
    EXECUTE FUNCTION check_lights_limit_update();


    CREATE OR REPLACE FUNCTION validate_pump_tanks_system()
RETURNS TRIGGER AS $$
DECLARE
    origin_system BIGINT;
    dest_system BIGINT;
BEGIN
    
    SELECT system INTO origin_system FROM tanks WHERE id = NEW.origin;
    
    SELECT system INTO dest_system FROM tanks WHERE id = NEW.destination;
    
    IF origin_system IS NULL OR dest_system IS NULL THEN
        RAISE EXCEPTION 'Tank not found';
    END IF;
    
    IF origin_system != NEW.system OR dest_system != NEW.system THEN
        RAISE EXCEPTION 'Both tanks must belong to the same system as the pump';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_pump_tanks_system
    BEFORE INSERT OR UPDATE ON public.pumps
    FOR EACH ROW
    EXECUTE FUNCTION validate_pump_tanks_system();