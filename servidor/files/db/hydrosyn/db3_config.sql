
USE hydrosyn_db;

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



INSERT INTO config (value, min_value, max_value, group_id) VALUES
(3, 3, 5,1),       -- Failed login or password recovery attempts before temporary lockout
(5, 1, 10,1),      -- Time window (in minutes) to count failed attempts
(15, 1, 3600,1),   -- Lockout duration (in minutes) after exceeding failed attempts
(1, 1, 30,2),      -- Maximum session duration (in days)
--(15, 1, 60,2),   -- Access token duration (in minutes)
--(90, 1, 90,2),      -- Refresh token duration (in days)
(2, 0, 23,3),      -- Daily cleanup hour  (0 to 23)
(24, 1, 24,3),    -- Time limit to first login (in hours)
(0, 0, 1,4), -- Delete user with history save
(365, 90, 1825,5),  -- Days to retain config history
(365, 90, 1825,5),  -- Days to retain hystory delete user  possible
(365, 90, 1825,5),  -- Days to retain hystory 2fa activation
(365, 90, 1825,5),  -- Days to retain hystory user activation
(365,90,1825,5),  -- Days to retain hystory email verification
(365, 90, 1825,5),  -- Days to retain username policy history before deletion
(365, 90, 1825,5),  -- Days to retain password policy history before deletion
(365, 90, 1825,5),  -- Days to retain special char password policy before deletion
(365,90,1825,5),  -- Days to retain blacklist username history before deletion
(365, 90, 1825,5),  -- Days to retain users email changes before deletion
(365, 90, 1825,5),  -- Days to retain username change history before deletion
(365, 90, 1825,5),  -- Days to retain login attempts before deletion
(365, 90, 1825,5),  -- Days to retain history email notifications
(365, 90, 1825,5),  -- Days to retain history   notification should send email
(365, 90, 1825,5),  -- Days to retain notifications
(365, 90, 1825,5),  -- Days to delete permissions  associated to roles hystory
(365, 90, 1825,5);  -- Days to retain role associated to users history before deletion








    





    
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




(5, 'es', 'Hora de limpieza diaria', 'Hora del día (0-23) en que se eliminarán sesiones y tokens expirados'),
(5, 'en', 'Daily cleanup hour', 'Hour of the day (0–23) to remove expired sessions and tokens'),


(6, 'es', 'Tiempo para verificar cuenta', 'Horas disponibles para verificar el correo y cambiar la contraseña temporal'),
(6, 'en', 'Initial verification window', 'Hours available to verify email and update temporary password'),

(7, 'es', 'Eliminar usuario con historial', 'Indica si se puede borrar un usuario con historial. El historico sera propiedad del system (0=No, 1=Sí)'),
(7, 'en', 'Delete user with history', 'Whether a user can be deleted while preserving their history. The history will be assigned to system (0=No, 1=Yes)');
INSERT INTO config_translations (config_id, lang_code, name, description) VALUES
(8, 'es', 'Retención de historial de configuración', 'Días que se conservarán los registros históricos de cambios en la configuración del sistema'),
(8, 'en', 'Config history retention', 'Days to retain system configuration change history'),
(9, 'es', 'Retención de historial de borrar usuarios automáticamente', 
    'Número de días que se conservarán los registros históricos relacionados con la eliminación automática de usuarios en el sistema'),
(9, 'en', 'Deleted users history retention', 
    'Number of days to keep historical records related to the automatic deletion of users in the system'),
(10, 'es', 'Historial de activación/desactivación 2FA', 
    'Número de días que se conservarán los registros históricos relacionados con la activación y desactivación de la autenticación de dos factores'),
(10, 'en', '2FA activation/deactivation history', 
    'Number of days to keep historical records related to the activation and deactivation of two-factor authentication'),
    (11, 'es', 'Historial de activación de usuarios', 
    'Número de días que se conservarán los registros históricos relacionados con la activación de usuarios en el sistema'),
(11, 'en', 'User activation history', 
    'Number of days to keep historical records related to user activations in the system'),
(12, 'es', 'Historial de verificación por correo electrónico', 
    'Número de días que se conservarán los registros históricos relacionados con la verificación por correo electrónico'),
(12, 'en', 'Email verification history', 
    'Number of days to keep historical records related to email verification'),
(13, 'es', 'Retención de políticas de nombres de usuario', 
    'Número de días que se conservarán los registros históricos de políticas de nombres de usuario antes de su eliminación'),
(13, 'en', 'Username policy retention', 'Number of days to keep historical records related to username policies before deletion'),
(14, 'es', 'Retención de políticas de contraseña', 
    'Número de días que se conservarán los registros históricos de políticas de contraseña antes de su eliminación'),
(14, 'en', 'Password policy retention', 'Number of days to keep historical records related to password policies before deletion'),
(15, 'es', 'Retención de políticas de caracteres especiales en contraseñas', 
    'Número de días que se conservarán los registros históricos de políticas de caracteres especiales en contraseñas antes de su eliminación'),
(15, 'en', 'Special character password policy retention', 
    'Number of days to keep historical records related to special character password policies before deletion'),
(16, 'es', 'Historial de nombres de la lista negra', 
    'Número de días que se conservarán los registros históricos relacionados con los nombres de la lista negra'),
(16, 'en', 'Blacklist username history', 
    'Number of days to keep historical records related to blacklist usernames'),
(17, 'es', 'Retención de cambios de correo', 'Días que se conservarán los registros de cambios de email'),
(17, 'en', 'Email change history retention', 'Days to retain email change logs'),
(18, 'es', 'Retención de cambios de nombre de usuario', 'Días que se conservarán los registros de cambios de nombre de usuario'),
(18, 'en', 'Username change history retention', 'Days to retain username change logs'),

(19, 'es', 'Retención de intentos de acceso y recuperación', 'Días que se conservarán los intentos de inicio de sesión y recuperación de contraseña'),
(19, 'en', 'Access and recovery attempts retention', 'Days to retain login and password recovery attempt history'),
(20, 'es', 'Retención de historial de email para notificaciones', 'Días que se conservarán los registros históricos de cambios de email para notificaciones'),
(20, 'en', 'Notification email history retention', 'Days to retain notification email change history'),

(21, 'es', 'Retención de historial de notificaciones por email', 'Días que se conservarán los registros históricos de cambios en si las notificaciones deben enviarse por email'),
(21, 'en', 'Notification email sending history retention', 
 'Number of days to retain historical records of changes in whether notifications should be sent by email'),

(22, 'es', 'Retención de historial de notificaciones', 'Días que se conservarán las notificaciones'),
(22, 'en', 'Notification retention', 'Days to retain notifications'),

(23, 'es', 'Retención de permisos asociados a roles', 'Días que se conservarán los permisos  asociados a roles borrados antes de su eliminación'),
(23, 'en', 'Role permissions retention', 'Number of days to retain permissions associated with deleted roles before they are permanently removed'),
(24, 'es', 'Retención de historial de roles asociados a usuarios', 'Días que se conservarán los registros históricos de roles asignados a usuarios antes de su eliminación definitiva'),
(24, 'en', 'User role history retention', 'Number of days to retain the historical association between users and roles before it is permanently deleted');





























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
     IF NEW.value = OLD.value THEN
        SIGNAL SQLSTATE '33004'
        SET MESSAGE_TEXT = 'The new value must be different from the current value.';
    END IF;
    IF NEW.id != OLD.id THEN
        SIGNAL SQLSTATE '33005'
        SET MESSAGE_TEXT = 'The "id" field cannot be modified.';
    END IF;
END$$

DELIMITER ;

