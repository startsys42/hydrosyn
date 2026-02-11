-- borrar usuario admin, borrar sistema,  inactivar admin activar

CREATE OR REPLACE FUNCTION prevent_multiple_roles()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    -- if there is already at least one record, block
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
  -- check if the user is in roles
  SELECT EXISTS (
    SELECT 1 FROM public.roles r WHERE r.user = NEW.admin
  ) INTO has_role;

  IF NOT has_role THEN
    -- count how many systems the user already has
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

-- trigger only for INSERT
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

-- Trigger independiente para INSERT
CREATE TRIGGER trg_prevent_insert_duplicate_name
BEFORE INSERT ON public.systems
FOR EACH ROW
EXECUTE FUNCTION prevent_insert_duplicate_name();


CREATE OR REPLACE FUNCTION prevent_update_duplicate_name()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo bloquear si se está cambiando el nombre
  IF NEW.name IS DISTINCT FROM OLD.name THEN
    IF EXISTS (
      SELECT 1
      FROM public.systems s
      WHERE s.admin = NEW.admin
        AND s.name= NEW.name
        AND s.id <> OLD.id -- excluye la propia fila
    ) THEN
      RAISE EXCEPTION 'Cannot update: this admin already has another system with this name';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger independiente para UPDATE
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
  -- Obtener el admin del sistema actual
  SELECT s.admin INTO admin_user
  FROM public.systems s
  WHERE s.id = NEW.system;

  -- Verificar si el admin está en roles
  IF NOT EXISTS (SELECT 1 FROM public.roles r WHERE r.user = admin_user) THEN
    -- Contar usuarios distintos asociados a TODOS los sistemas de ese admin
    SELECT COUNT(DISTINCT su.user_id)
    INTO total_users
    FROM public.systems_users su
    JOIN public.systems s2 ON su.system = s2.id
    WHERE s2.admin = admin_user;

    -- Si ya tiene 5 o más, bloquear
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
  -- Solo si cambia el nombre
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
  -- Obtener el admin del sistema relacionado
  SELECT s.admin INTO admin_user
  FROM public.systems s
  WHERE s.id = NEW.system;


  SELECT EXISTS (
    SELECT 1 FROM public.roles r WHERE r.user = admin_user
  ) INTO has_role;

  -- Si el admin NO está en roles
  IF NOT has_role THEN
    -- Contar cuántos ESP32 ya existen en este sistema
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

-- Trigger solo para INSERT
CREATE TRIGGER trg_check_esp32_limit
BEFORE INSERT ON public.esp32
FOR EACH ROW
EXECUTE FUNCTION check_esp32_limit();


CREATE OR REPLACE FUNCTION prevent_multiple_secrets_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Verificar si ya existe un secreto para ese system
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
  -- No permitir cambiar el system
  IF NEW.system IS DISTINCT FROM OLD.system THEN
    RAISE EXCEPTION 'Cannot change system for an existing secret';
  END IF;

  -- Validar longitud del code
  IF length(NEW.code) < 10 OR length(NEW.code) > 30 THEN
    RAISE EXCEPTION 'Code must be between 10 and 30 characters long';
  END IF;

  -- Validar formato alfanumérico
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
    -- Si el sistema asociado sigue existiendo, no permitir borrar
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
    -- Verifica si se desactivó el admin
    IF OLD.is_active = TRUE AND NEW.is_active = FALSE THEN
        -- Desactiva todos los users de los sistemas de este admin
        UPDATE systems_users su
        SET is_active = FALSE
        FROM systems s
        WHERE s.admin = NEW.user
          AND su.system = s.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger sobre admin_users
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
      FROM public.pump p
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
    -- obtener system del ESP32
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

-- Trigger
CREATE TRIGGER check_pump_esp32_system
BEFORE INSERT OR UPDATE ON pumps
FOR EACH ROW
EXECUTE FUNCTION validate_pump_esp32_system();




CREATE FUNCTION check_water_clean_tank_type() RETURNS trigger AS $$
BEGIN
    IF (SELECT type FROM public.tanks WHERE id = NEW.tank) <> 'water' THEN
        RAISE EXCEPTION 'Tank must be of type water';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_water_clean_tank_type
BEFORE INSERT OR UPDATE ON public.water_clean
FOR EACH ROW EXECUTE FUNCTION check_water_clean_tank_type();


CREATE FUNCTION check_water_clean_volume() RETURNS trigger AS $$
DECLARE
    tank_volume numeric;
BEGIN
    SELECT volume INTO tank_volume FROM public.tanks WHERE id = NEW.tank;

    IF NEW.volume > tank_volume THEN
        RAISE EXCEPTION 'Volume exceeds tank capacity (%).', tank_volume;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_water_clean_volume
BEFORE INSERT OR UPDATE ON public.water_clean
FOR EACH ROW EXECUTE FUNCTION check_water_clean_volume();

CREATE FUNCTION check_water_clean_user() RETURNS trigger AS $$
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

CREATE TRIGGER trigger_check_water_clean_user
BEFORE INSERT OR UPDATE ON public.water_clean
FOR EACH ROW EXECUTE FUNCTION check_water_clean_user();


CREATE FUNCTION check_drainings_tank_type() RETURNS trigger AS $$
DECLARE
    tank_type tank_type;
BEGIN
    SELECT type INTO tank_type FROM public.tanks WHERE id = NEW.tank;

    IF tank_type IN ('water','nutrients') THEN
        RAISE EXCEPTION 'Tank cannot be of type water or nutrients';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_drainings_tank_type
BEFORE INSERT OR UPDATE ON public.drainings
FOR EACH ROW EXECUTE FUNCTION check_drainings_tank_type();



CREATE FUNCTION check_drainings_volume() RETURNS trigger AS $$
DECLARE
    tank_volume numeric;
BEGIN
    SELECT volume INTO tank_volume FROM public.tanks WHERE id = NEW.tank;
    IF NEW.volume > tank_volume THEN
        RAISE EXCEPTION 'Volume exceeds tank capacity (%).', tank_volume;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_drainings_volume
BEFORE INSERT OR UPDATE ON public.drainings
FOR EACH ROW EXECUTE FUNCTION check_drainings_volume();

CREATE FUNCTION check_drainings_user() RETURNS trigger AS $$
BEGIN
    -- Verificar que el tanque pertenece a un sistema cuyo admin está activo
    -- y que el usuario que inserta es admin o usuario activo del sistema
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

CREATE TRIGGER trigger_check_drainings_user
BEFORE INSERT OR UPDATE ON public.drainings
FOR EACH ROW EXECUTE FUNCTION check_drainings_user();
