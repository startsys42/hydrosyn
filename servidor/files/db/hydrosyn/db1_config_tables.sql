CREATE DATABASE IF NOT EXISTS hydrosyn_db CHARACTER SET utf8mb4 COLLATE  utf8mb4_bin;
USE hydrosyn_db;

CREATE TABLE IF NOT EXISTS config (
    id INT UNSIGNED  PRIMARY KEY AUTO_INCREMENT,
    value INT UNSIGNED NOT NULL, 
    min_value INT UNSIGNED NOT NULL,  
    max_value INT UNSIGNED NOT NULL  
);





CREATE TABLE IF NOT EXISTS config_translations (
    id INT UNSIGNED  PRIMARY KEY AUTO_INCREMENT,
    config_id INT UNSIGNED  NOT NULL,
    lang_code ENUM('es', 'en') NOT NULL,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255) NOT NULL,

    FOREIGN KEY (config_id) REFERENCES config(id)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT,

    UNIQUE (config_id, lang_code)
);

INSERT INTO config (value, min_value, max_value) VALUES
(3, 3, 5),       -- Failed login or password recovery attempts before temporary lockout
(5, 1, 10),      -- Time window (in minutes) to count failed attempts
(15, 1, 3600),   -- Lockout duration (in minutes) after exceeding failed attempts
(1, 1, 30),      -- Maximum session duration (in days)
(15, 1, 60),   -- Access token duration (in minutes)
(90, 1, 90),      -- Refresh token duration (in days)
(2, 0, 23),      -- Daily cleanup hour sessions and tokens (0 to 23)
(24, 1, 24),    -- Time limit to verify email or change password (in hours)
(365, 90, 1825),  -- Days to retain unverified users before deletion
(2, 1, 10),      -- Time to force username change after policy update (in days)
(365, 90, 1825),  -- Days to retain username policy history before deletion
(2, 1, 10),      -- Time to force password change after policy update (in days)
(365, 90, 1825),  -- Days to retain password policy history before deletion
(365, 90, 1825),  -- Days to retain users activation history before deletion
(365, 90, 1825),  -- Days to retain users email changes before deletion
    
(365, 90, 1825);  -- Days to retain login attempts before deletion



    
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
(5, 'es', 'Duración del Access Token', 'Duración en minutos del token de acceso JWT antes de expirar'),
(5, 'en', 'Access token duration', 'JWT access token lifespan in minutes before expiration'),

-- Config ID 6
(6, 'es', 'Duración del Refresh Token', 'Duración en días del token de renovación JWT antes de expirar'),
(6, 'en', 'Refresh token duration', 'JWT refresh token lifespan in days before expiration'),

-- Config ID 7
(7, 'es', 'Hora de limpieza diaria', 'Hora del día (0-23) en que se eliminarán sesiones y tokens expirados'),
(7, 'en', 'Daily cleanup hour', 'Hour of the day (0–23) to remove expired sessions and tokens'),

-- Config ID 8
(8, 'es', 'Tiempo para verificar cuenta', 'Horas disponibles para verificar el correo y cambiar la contraseña temporal'),
(8, 'en', 'Initial verification window', 'Hours available to verify email and update temporary password'),

-- Config ID 9
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
(16, 'en', 'Access and recovery attempts retention', 'Days to retain login and password recovery attempt history');



-- Prevent insertion into the 'config' table to enforce controlled setup
CREATE TRIGGER block_insert_config
BEFORE INSERT ON config
FOR EACH ROW
SIGNAL SQLSTATE '11000' SET MESSAGE_TEXT = 'Insertion into the config table is prohibited';

--  Prevent deletion from the 'config' table to preserve system configuration
CREATE TRIGGER block_delete_config
BEFORE DELETE ON config
FOR EACH ROW
SIGNAL SQLSTATE '12000' SET MESSAGE_TEXT = 'Deletion from the config table is prohibited';

--  Prevent insertion into the 'config_translations' table to avoid unapproved language entries
CREATE TRIGGER block_insert_config_translations
BEFORE INSERT ON config_translations
FOR EACH ROW
SIGNAL SQLSTATE '21000' SET MESSAGE_TEXT = 'Insertion into the config_translations table is prohibited';

--  Prevent deletion from the 'config_translations' table to retain translation integrity
CREATE TRIGGER block_delete_config_translations
BEFORE DELETE ON config_translations
FOR EACH ROW
SIGNAL SQLSTATE '22000' SET MESSAGE_TEXT = 'Deletion from the config_translations table is prohibited';

--  Prevent updates to 'config_translations' to avoid altering validated texts
CREATE TRIGGER block_update_config_translations
BEFORE UPDATE ON config_translations
FOR EACH ROW
SIGNAL SQLSTATE '23000' SET MESSAGE_TEXT = 'Updation from the config_translations table is prohibited';

DELIMITER $$

CREATE TRIGGER validate_config_value_update_only
BEFORE UPDATE ON config
FOR EACH ROW
BEGIN
    IF NEW.min_value != OLD.min_value OR NEW.max_value != OLD.max_value THEN
        SIGNAL SQLSTATE '13001' SET MESSAGE_TEXT = 'Only the "value" field can be updated. "min_value" and "max_value" are read-only.';
    END IF;

    IF NEW.value < OLD.min_value THEN
        SIGNAL SQLSTATE '13002' SET MESSAGE_TEXT = 'The new value is below the minimum allowed.';
    END IF;

    IF NEW.value > OLD.max_value THEN
        SIGNAL SQLSTATE '13003' SET MESSAGE_TEXT = 'The new value exceeds the maximum allowed.';
    END IF;
END$$

DELIMITER ;



-- TIRGER APAR REAJUSTAR EINDICE UTOINCREMENT cambair contarseña usuario abse e dtaos
