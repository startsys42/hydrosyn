CREATE DATABASE IF NOT EXISTS hydrosyn_db CHARACTER SET utf8mb4 COLLATE  utf8mb4_bin;
USE hydrosyn_db;

-- CONFIGURAR BORRA USUARIO SIN PRIEMR LOGIN TIEMPO Y  NOTIFICAR




CREATE TABLE IF NOT EXISTS config_groups (
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT

)ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS config_group_translations (
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    group_id INT UNSIGNED NOT NULL,
    lang_code ENUM('es', 'en') NOT NULL,
    name VARCHAR(100) NOT NULL UNIQUE,


    FOREIGN KEY (group_id) REFERENCES config_groups(id)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT,

    UNIQUE (group_id, lang_code)
)ENGINE=InnoDB;


CREATE TABLE IF NOT EXISTS config (
    id INT UNSIGNED  PRIMARY KEY AUTO_INCREMENT,
    value INT UNSIGNED NOT NULL, 
    min_value INT UNSIGNED NOT NULL,  
    max_value INT UNSIGNED NOT NULL,
    group_id INT UNSIGNED NOT NULL,
     FOREIGN KEY (group_id) REFERENCES config_groups(id)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT

)ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS config_translations(
    id INT UNSIGNED  PRIMARY KEY AUTO_INCREMENT,
    config_id INT UNSIGNED  NOT NULL,
    lang_code ENUM('es', 'en') NOT NULL,
    name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255) NOT NULL UNIQUE,

    FOREIGN KEY (config_id) REFERENCES config(id)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT,

    UNIQUE (config_id, lang_code)
)ENGINE=InnoDB;



INSERT INTO config_groups  VALUES ();
INSERT INTO config_group_translations (group_id, lang_code, name) VALUES
(1, 'es', 'Seguridad de sesión'),
(1, 'en', 'Session Security');

INSERT INTO config_groups  VALUES ();
INSERT INTO config_group_translations (group_id, lang_code, name) VALUES
(2, 'es', 'Duración de autenticación'),
(2, 'en', 'Authentication Duration');

INSERT INTO config_groups  VALUES ();
INSERT INTO config_group_translations (group_id, lang_code, name) VALUES
(3, 'es', 'Tiempos de gracia y tareas'),
(3, 'en', 'Grace periods and tasks');




INSERT INTO config_groups  VALUES ();
INSERT INTO config_group_translations (group_id, lang_code, name) VALUES
(4, 'es', 'Borra usuario antes de tiempo'),
(4, 'en', 'Delete user before time');


INSERT INTO config_groups VALUES ();
INSERT INTO config_group_translations (group_id, lang_code, name) VALUES
(5, 'es', 'Tiempos de retención históricos'),
(5, 'en', 'Historical retention periods');

INSERT INTO config (value, min_value, max_value, group_id) VALUES
(3, 3, 5,1),       -- Failed login or password recovery attempts before temporary lockout
(5, 1, 10,1),      -- Time window (in minutes) to count failed attempts
(15, 1, 3600,1),   -- Lockout duration (in minutes) after exceeding failed attempts
(1, 1, 30,2),      -- Maximum session duration (in days)
--(15, 1, 60,2),   -- Access token duration (in minutes)
--(90, 1, 90,2),      -- Refresh token duration (in days)
(2, 0, 23,3),      -- Daily cleanup hour  (0 to 23)
(24, 1, 24,3),    -- Time limit to first login (in hours)
(0, 0, 1,4); -- Delete user with history save
(365, 90, 1825,5),  -- Days to retain config history


(365, 90, 1825,5),  -- Days to retain unverified users before deletion

(365, 90, 1825,5),  -- Days to retain username policy history before deletion

(365, 90, 1825,5),  -- Days to retain password policy history before deletion
(365, 90, 1825,5),  -- Days to retain users activation history before deletion
(365, 90, 1825,5),  -- Days to retain users email changes before deletion
    
(365, 90, 1825,5),  -- Days to retain login attempts before deletion




    
-- Para intentos de sesión
INSERT INTO config_translations (config_id, lang_code, name, description)
VALUES 

-- Config ID 1
(1, 'es', 'Intentos fallidos permitidos', 'Número máximo de intentos fallidos de inicio de sesión o recuperación  de contraseña antes del bloqueo temporal'),
(1, 'en', 'Allowed failed attempts', 'Maximum number of failed login or recovery password attempts before temporary lockout'),

-- Config ID 2
(2, 'es', 'Ventana de intentos fallidos', 'Período en minutos durante el cual se contabilizan los intentos fallidos'),
(2, 'en', 'Failed attempts window', 'Time window in minutes during which failed attempts are counted'),

-- Config ID 3
(3, 'es', 'Duración del bloqueo', 'Tiempo en minutos que dura el bloqueo tras superar los intentos fallidos permitidos'),
(3, 'en', 'Lockout duration', 'Duration in minutes of the lockout after exceeding failed attempts'),

    
-- Config ID 4
(4, 'es', 'Duración máxima de sesión', 'Cantidad de días que puede mantenerse activa una sesión sin cerrar'),
(4, 'en', 'Max session duration', 'Number of days a session can remain active without logout'),

-- Config ID 5
--(5, 'es', 'Duración del Access Token', 'Duración en minutos del token de acceso JWT antes de expirar'),
--(5, 'en', 'Access token duration', 'JWT access token lifespan in minutes before expiration'),

-- Config ID 6
--(6, 'es', 'Duración del Refresh Token', 'Duración en días del token de renovación JWT antes de expirar'),
--(6, 'en', 'Refresh token duration', 'JWT refresh token lifespan in days before expiration'),


(5, 'es', 'Hora de limpieza diaria', 'Hora del día (0-23) en que se eliminarán sesiones y tokens expirados'),
(5, 'en', 'Daily cleanup hour', 'Hour of the day (0–23) to remove expired sessions and tokens'),


(6, 'es', 'Tiempo para verificar cuenta', 'Horas disponibles para verificar el correo y cambiar la contraseña temporal'),
(6, 'en', 'Initial verification window', 'Hours available to verify email and update temporary password'),

(7, 'es', 'Eliminar usuario con historial', 'Indica si se puede borrar un usuariocon historial.El historico sera propiedad del admin (0=No, 1=Sí)'),
(7, 'en', 'Delete user with history', 'Whether a user can be deleted while preserving their history. The history will be assigned to admin (0=No, 1=Yes)');
INSERT INTO config_translations (config_id, lang_code, name, description) VALUES
(8, 'es', 'Retención de historial de configuración', 'Días que se conservarán los registros históricos de cambios en la configuración del sistema'),
(8, 'en', 'Config history retention', 'Days to retain system configuration change history'),



(9, 'es', 'Retención de usuarios no verificados', 'Número de días que se conservarán las cuentas sin verificar'),
(9, 'en', 'Unverified user retention', 'Number of days unverified user accounts are retained'),

-- Config ID 10
(10, 'es', 'Plazo para cambio de nombre', 'Días para actualizar el nombre de usuario según la política'),
(10, 'en', 'Username change deadline', 'Days to update username to comply with new policy'),
    
-- Config ID 11
(11, 'es', 'Retención de políticas de nombre de usuario', 'Días que se conservarán los registros históricos de políticas de nombres de usuario'),
(11, 'en', 'Username policy retention', 'Days to retain historical username policy records'),
-- Config ID 12
(12, 'es', 'Plazo para cambio de contraseña', 'Días para actualizar la contraseña según la política'),
(12, 'en', 'Password change deadline', 'Days to update password to comply with new policy'),

-- Config ID 13
(13, 'es', 'Retención de políticas de contraseña', 'Días que se conservarán los registros históricos de políticas de contraseña'),
(13, 'en', 'Password policy retention', 'Days to retain historical password policy records'),







-- Config ID 14
(14, 'es', 'Retención de activación de cuentas', 'Días que se mantendrán los cambios de estado de cuenta'),
(14, 'en', 'Account activation history retention', 'Days to retain account activation changes'),

-- Config ID 15
(15, 'es', 'Retención de cambios de correo', 'Días que se conservarán los registros de cambios de email'),
(15, 'en', 'Email change history retention', 'Days to retain email change logs'),

-- Config ID 16
(16, 'es', 'Retención de intentos de acceso y recuperación', 'Días que se conservarán los intentos de inicio de sesión y recuperación de contraseña'),
(16, 'en', 'Access and recovery attempts retention', 'Days to retain login and password recovery attempt history'),









CREATE TRIGGER trg_block_insert_config_groups
BEFORE INSERT ON config_groups
FOR EACH ROW
SIGNAL SQLSTATE '11000' SET MESSAGE_TEXT = 'Insertion into the config_groups table is prohibited';

--  Prevent deletion from the 'config' table to preserve system configuration
CREATE TRIGGER trg_block_delete_config_groups
BEFORE DELETE ON config_groups
FOR EACH ROW
SIGNAL SQLSTATE '12000' SET MESSAGE_TEXT = 'Deletion from the config_groups table is prohibited';


CREATE TRIGGER trg_block_update_config_groups
BEFORE UPDATE ON config_groups
FOR EACH ROW
SIGNAL SQLSTATE '13000' SET MESSAGE_TEXT = 'Updation from the config_groups table is prohibited';

--  Prevent insertion into the 'config_translations' table to avoid unapproved language entries
CREATE TRIGGER trg_block_insert_config_groups_translations
BEFORE INSERT ON config_group_translations
FOR EACH ROW
SIGNAL SQLSTATE '21000' SET MESSAGE_TEXT = 'Insertion into the config_group_translations table is prohibited';

--  Prevent deletion from the 'config_translations' table to retain translation integrity
CREATE TRIGGER trg_block_delete_config_groups_translations
BEFORE DELETE ON config_group_translations
FOR EACH ROW
SIGNAL SQLSTATE '22000' SET MESSAGE_TEXT = 'Deletion from the config_group_translations table is prohibited';

--  Prevent updates to 'config_translations' to avoid altering validated texts
CREATE TRIGGER trg_block_update_config_groups_translations
BEFORE UPDATE ON config_group_translations
FOR EACH ROW
SIGNAL SQLSTATE '23000' SET MESSAGE_TEXT = 'Updation from the config_group_translations table is prohibited';














-- Prevent insertion into the 'config' table to enforce controlled setup
CREATE TRIGGER trg_block_insert_config
BEFORE INSERT ON config
FOR EACH ROW
SIGNAL SQLSTATE '31000' SET MESSAGE_TEXT = 'Insertion into the config table is prohibited';

--  Prevent deletion from the 'config' table to preserve system configuration
CREATE TRIGGER trg_block_delete_config
BEFORE DELETE ON config
FOR EACH ROW
SIGNAL SQLSTATE '32000' SET MESSAGE_TEXT = 'Deletion from the config table is prohibited';

--  Prevent insertion into the 'config_translations' table to avoid unapproved language entries
CREATE TRIGGER trg_block_insert_config_translations
BEFORE INSERT ON config_translations
FOR EACH ROW
SIGNAL SQLSTATE '41000' SET MESSAGE_TEXT = 'Insertion into the config_translations table is prohibited';

--  Prevent deletion from the 'config_translations' table to retain translation integrity
CREATE TRIGGER trg_block_delete_config_translations
BEFORE DELETE ON config_translations
FOR EACH ROW
SIGNAL SQLSTATE '42000' SET MESSAGE_TEXT = 'Deletion from the config_translations table is prohibited';

--  Prevent updates to 'config_translations' to avoid altering validated texts
CREATE TRIGGER trg_block_update_config_translations
BEFORE UPDATE ON config_translations
FOR EACH ROW
SIGNAL SQLSTATE '43000' SET MESSAGE_TEXT = 'Updation from the config_translations table is prohibited';

DELIMITER $$

CREATE TRIGGER trg_validate_config_value_update_only
BEFORE UPDATE ON config
FOR EACH ROW
BEGIN
    IF NEW.min_value != OLD.min_value OR NEW.max_value != OLD.max_value THEN
        SIGNAL SQLSTATE '33001' SET MESSAGE_TEXT = 'Only the "value" field can be updated. "min_value" and "max_value" are read-only.';
    END IF;

    IF NEW.value < OLD.min_value THEN
        SIGNAL SQLSTATE '33002' SET MESSAGE_TEXT = 'The new value is below the minimum allowed.';
    END IF;

    IF NEW.value > OLD.max_value THEN
        SIGNAL SQLSTATE '33003' SET MESSAGE_TEXT = 'The new value exceeds the maximum allowed.';
    END IF;
END$$

DELIMITER ;



CREATE TABLE IF NOT EXISTS config_history (
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    config_id INT UNSIGNED NOT NULL,
    old_value INT UNSIGNED NOT NULL,
    new_value INT UNSIGNED NOT NULL,
    changed_by INT UNSIGNED NOT NULL ,
    change_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  
    
    FOREIGN KEY (config_id) REFERENCES config(id)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT,
    
    FOREIGN KEY (changed_by) REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB;

DELIMITER $$

CREATE TRIGGER trg_config_history_validate_value_ranges
BEFORE INSERT ON config_history
FOR EACH ROW
BEGIN
    DECLARE config_min_value INT UNSIGNED ;
    DECLARE config_max_value INT UNSIGNED ;
    DECLARE last_new_value INT UNSIGNED;

    -- Get min and max allowed values from config table
    SELECT min_value, max_value INTO config_min_value, config_max_value 
    FROM config 
    WHERE id = NEW.config_id;

    -- Validate old_value is within allowed range
   IF NEW.old_value < config_min_value OR NEW.old_value > config_max_value THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = CONCAT('Config history old_value is outside allowed range (min: ', 
                                 config_min_value, ', max: ', config_max_value, ')');
    END IF;

    -- Validate new_value is within allowed range
    IF NEW.new_value < config_min_value OR NEW.new_value > config_max_value THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = CONCAT('Config history new_value is outside allowed range (min: ', 
                                 config_min_value, ', max: ', config_max_value, ')');
    END IF;

    SELECT new_value INTO last_new_value
FROM config_history
WHERE config_id = NEW.config_id
ORDER BY change_timestamp DESC, id DESC
LIMIT 1;

-- If there is a previous record, validate old_value = last_new_value
IF last_new_value IS NOT NULL THEN
    IF NEW.old_value <> last_new_value THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = CONCAT('The old_value (', NEW.old_value, 
                                 ') must be equal to the last recorded new_value (', last_new_value, ') for config_id ', NEW.config_id);
    END IF;
END IF;
END$$



CREATE TRIGGER trg_config_history_prevent_latest_record_deletion
BEFORE DELETE ON config_history
FOR EACH ROW
BEGIN
    DECLARE latest_history_id INT UNSIGNED ;

    -- Get the most recent record ID for this config_id
    SELECT MAX(id) INTO latest_history_id 
    FROM config_history 
    WHERE config_id = OLD.config_id;

    -- Prevent deletion if this is the most recent record
IF OLD.id = latest_history_id THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = CONCAT('Cannot delete the most recent configuration history record for config_id: ', 
                                OLD.config_id);
    END IF;
END$$

DELIMITER ;

DELIMITER $$
CREATE PROCEDURE reorganize_config_history_ids()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE old_id, new_id, max_id INT UNSIGNED ;
    DECLARE update_count INT DEFAULT 0;
    DECLARE id_cursor CURSOR FOR SELECT id FROM config_history ORDER BY id;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    -- Start transaction for safety
    START TRANSACTION;
    
    -- Temporarily disable foreign key checks
 
    
    -- Initialize counter
    SET new_id = 1;
    
    -- Open cursor to scan through existing IDs
    OPEN id_cursor;
    
    id_loop: LOOP
        FETCH id_cursor INTO old_id;
        IF done THEN
            LEAVE id_loop;
        END IF;
        
        -- Only update if current ID doesn't match the desired sequence
        IF old_id != new_id THEN
            -- Check if target ID is available
            SET @id_exists = 0;
            SELECT COUNT(*) INTO @id_exists FROM config_history WHERE id = new_id;
            
            IF @id_exists = 0 THEN
                -- Perform the direct ID update
                UPDATE config_history SET id = new_id WHERE id = old_id;
                SET update_count = update_count + 1;
        
            END IF;
        END IF;
        
        SET new_id = new_id + 1;
    END LOOP;
    
    CLOSE id_cursor;
    COMMIT;
    -- Reset auto-increment value
     SELECT IFNULL(MAX(id), 0) + 1 INTO max_id FROM config_history;
    SET @stmt = CONCAT('ALTER TABLE config_history AUTO_INCREMENT = ', max_id);
    PREPARE stmt FROM @stmt;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
    

    
    -- Commit all changes
    
    
  
END$$

DELIMITER ;