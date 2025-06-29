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
(1, 1, 90),      -- Refresh token duration (in days)
(2, 0, 23),      -- Daily cleanup hour sessions and tokens (0 to 23)
(24, 1, 24),    -- Time limit to verify email or change password (in hours)
(365, 90, 1825),  -- Days to retain unverified users before deletion
(2, 1, 10);      -- Time to force username change after policy update (in days)
(365, 90, 1825),  -- Days to retain username policy history before deletion
(2, 1, 10);      -- Time to force password change after policy update (in days)
(365, 90, 1825),  -- Days to retain password policy history before deletion
(365, 90, 1825),  -- Days to retain users activation history before deletion
(365, 90, 1825),  -- Days to retain users email changes before deletion
    
(365, 90, 1825),  -- Days to retain login attempts before deletion

-- Para intentos de sesión
INSERT INTO config_translations (config_id, lang_code, name, description)
VALUES 
(1, 'es', 'Número de intentos de sesión', 'Cantidad máxima de intentos fallidos antes de bloqueo'),
(1, 'en', 'Session attempts number', 'Maximum failed login attempts before lockout');

INSERT INTO config_translations (config_id, lang_code, name, description) VALUES
(2, 'es', 'Tiempo de duración de intentos', 'Duración en minutos durante la cual se cuentan los intentos fallidos'),
(2, 'en', 'Duration of attempts time', 'Duration in minutes during which failed attempts are counted');

-- Para tiempo de suspensión
INSERT INTO config_translations (config_id, lang_code, name, description)
VALUES
(3, 'es', 'Tiempo de suspensión', 'Duración en minutos de la suspensión tras intentos fallidos'),
(3, 'en', 'Suspension time', 'Duration in minutes of the suspension after failed attempts');


-- Agregar traducciones para esos nuevos configs
INSERT INTO config_translations (config_id, lang_code, name, description) VALUES
(4, 'es', 'Duración mínima de sesión', 'Duración máxima en días para la sesión web'),
(4, 'en', 'Minimum session duration', 'Maximum session web duration in days'),

(5, 'es', 'Duración mínima Access Token', 'Duración máxima en minutos para el Access Token JWT'),
(5, 'en', 'Minimum Access Token duration', 'Maximum duration in minutes for JWT Access Token'),

(6, 'es', 'Duración mínima Refresh Token', 'Duración máxima en días para el Refresh Token JWT'),
(6, 'en', 'Minimum Refresh Token duration', 'Maximum duration in days for JWT Refresh Token');
INSERT INTO config_translations (config_id, lang_code, name, description) VALUES
(7, 'es', 'Hora de limpieza de sesiones', 'Hora del día (0-23) para borrar sesiones expiradas'),
(7, 'en', 'Session cleanup hour', 'Hour of the day (0-23) to delete expired sessions');

INSERT INTO config_translations (config_id, lang_code, name, description) VALUES
(8, 'es', 'Tiempo para verificación inicial', 'Horas disponibles para que el usuario verifique su email y cambie su contraseña temporal');

-- Inglés
INSERT INTO config_translations (config_id, lang_code, name, description) VALUES
(8, 'en', 'Initial verification window', 'Hours available for the user to verify email and change temporary password');
INSERT INTO config_translations (config_id, lang_code, name, description) VALUES
(9, 'es', 'Tiempo de retención de registros', 'Días para mantener registros históricos de usuarios no verificados'),
(9, 'en', 'Retention time for records', 'Days to keep historical records of unverified users');
INSERT INTO config_translations (config_id, lang_code, name, description) VALUES
(10, 'es', 'Tiempo para cambio de nombre por política', 'Días disponibles para que el usuario cambie su nombre de usuario si no cumple la nueva política'),
(10, 'en', 'Username policy change grace period', 'Days given to users to change their username if it does not comply with the new policy');







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

CREATE TRIGGER validate_config_values BEFORE UPDATE ON config
FOR EACH ROW
BEGIN
    IF NEW.id = 1 THEN -- Max login attempts
        IF NEW.value < 3 THEN
            SIGNAL SQLSTATE '10101'
            SET MESSAGE_TEXT = 'Minimum allowed login attempts before lockout is 3';
        END IF;
        
    ELSEIF NEW.id = 2 THEN -- Suspension time (minutes)
        IF NEW.value < 15 THEN
            SIGNAL SQLSTATE '45002'
            SET MESSAGE_TEXT = 'Minimum suspension time after failed attempts must be 15 minutes';
        END IF;

    ELSEIF NEW.id = 3 THEN -- Session min duration (days)
        IF NEW.value < 1 THEN
            SIGNAL SQLSTATE '45003'
            SET MESSAGE_TEXT = 'Minimum session duration must be at least 1 day';
        END IF;

    ELSEIF NEW.id = 4 THEN -- Access token duration (minutes)
        IF NEW.value < 15 OR NEW.value > 60 THEN
            SIGNAL SQLSTATE '45004'
            SET MESSAGE_TEXT = 'Access token duration must be between 15 and 60 minutes';
        END IF;

    ELSEIF NEW.id = 5 THEN -- Refresh token duration (days)
        IF NEW.value < 1 THEN
            SIGNAL SQLSTATE '45005'
            SET MESSAGE_TEXT = 'Refresh token duration must be at least 1 day';
        END IF;

    ELSEIF NEW.id = 6 THEN -- Session cleanup hour (0-23)
        IF NEW.value < 0 OR NEW.value > 23 THEN
            SIGNAL SQLSTATE '45006'
            SET MESSAGE_TEXT = 'Session cleanup hour must be between 0 and 23';
        END IF;
    END IF;
END$$


DELIMITER ;
-- TIRGER APAR REAJUSTAR EINDICE UTOINCREMENT
