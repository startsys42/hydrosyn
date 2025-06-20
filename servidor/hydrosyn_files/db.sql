CREATE DATABASE IF NOT EXISTS hydrosyn_db CHARACTER SET utf8mb4 COLLATE  utf8mb4_bin;
USE hydrosyn_db;

CREATE TABLE config (
    id INT PRIMARY KEY AUTO_INCREMENT,
    value INT NOT NULL  -- solo un valor numérico entero
);

CREATE TABLE config_translations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    config_id INT NOT NULL,
    lang_code ENUM('es', 'en') NOT NULL,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255) NOT NULL,

    FOREIGN KEY (config_id) REFERENCES config(id)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT,

    UNIQUE (config_id, lang_code)
);

INSERT INTO config (value) VALUES (3);   -- intentos de sesión
INSERT INTO config (value) VALUES (15);  -- tiempo de suspensión (minutos)
-- Insertar nuevos valores (puedes usar UPDATE o INSERT dependiendo de si config ya tiene filas)
INSERT INTO config (value) VALUES (1);   -- duración máxima sesión (días)
INSERT INTO config (value) VALUES (15);  -- duración máxima access token (minutos)
INSERT INTO config (value) VALUES (1);   -- duración máxima refresh token (días)

-- Para intentos de sesión
INSERT INTO config_translations (config_id, lang_code, name, description)
VALUES 
(1, 'es', 'Número de intentos de sesión', 'Cantidad máxima de intentos fallidos antes de bloqueo'),
(1, 'en', 'Session attempts number', 'Maximum failed login attempts before lockout');

-- Para tiempo de suspensión
INSERT INTO config_translations (config_id, lang_code, name, description)
VALUES
(2, 'es', 'Tiempo de suspensión', 'Duración en minutos de la suspensión tras intentos fallidos'),
(2, 'en', 'Suspension time', 'Duration in minutes of the suspension after failed attempts');


-- Agregar traducciones para esos nuevos configs
INSERT INTO config_translations (config_id, lang_code, name, description) VALUES
(3, 'es', 'Duración mínima de sesión', 'Duración máxima en días para la sesión web'),
(3, 'en', 'Minimum session duration', 'Maximum session web duration in days'),

(4, 'es', 'Duración mínima Access Token', 'Duración máxima en minutos para el Access Token JWT'),
(4, 'en', 'Minimum Access Token duration', 'Maximum duration in minutes for JWT Access Token'),

(5, 'es', 'Duración mínima Refresh Token', 'Duración máxima en días para el Refresh Token JWT'),
(5, 'en', 'Minimum Refresh Token duration', 'Maximum duration in days for JWT Refresh Token');
CREATE TABLE permissions (
    id INT PRIMARY KEY AUTO_INCREMENT
                 
);

CREATE TABLE permission_translations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    permission_id INT NOT NULL,
    lang_code ENUM('es', 'en') NOT NULL,
    name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(250) NOT NULL UNIQUE,

    FOREIGN KEY (permission_id) REFERENCES permissions(id)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT,

    UNIQUE (permission_id, lang_code)
);

CREATE TABLE roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE
 
);

CREATE TABLE role_permissions (
    role_id INT NOT NULL,
    permission_id INT NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(id)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT,
    FOREIGN KEY (permission_id) REFERENCES permissions(id)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT
);




CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT NOT NULL,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
email_verified BOOLEAN NOT NULL DEFAULT FALSE, -- ¿Verificó el email vía link?

    email_verification_token VARCHAR(255),   -- Token único para verificar email
    failed_login_attempts INT NOT NULL DEFAULT 0,
  lockout_until TIMESTAMP NULL DEFAULT NULL;
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by INT NOT NULL,
     language ENUM('es', 'en') NOT NULL DEFAULT 'en',
    theme ENUM('dark', 'light') NOT NULL DEFAULT 'light',
    use_2fa BOOLEAN NOT NULL DEFAULT FALSE,
    twofa_secret VARCHAR(64),

    CONSTRAINT fk_user_creator
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

CREATE TABLE login_attempts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NULL,
    attempt_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45) NOT NULL,
    success BOOLEAN NOT NULL,
    user_agent VARCHAR(255),
    FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

CREATE TABLE password_policy_current (
    id INT PRIMARY KEY AUTO_INCREMENT,
    min_length INT NOT NULL DEFAULT 12,
    min_numbers INT NOT NULL DEFAULT 2,
    min_uppercase INT NOT NULL DEFAULT 1,
    min_special_chars INT NOT NULL DEFAULT 1,
    min_lowercase INT NOT NULL DEFAULT 1,
    min_unique_chars INT NOT NULL DEFAULT 8,
    max_password_age_days INT NOT NULL DEFAULT 90,
    min_password_history INT NOT NULL DEFAULT 5,
    min_password_age_history_days INT NOT NULL DEFAULT 450, -- nuevo campo

    applied_since TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    changed_by INT NOT NULL,

    CONSTRAINT fk_current_changed_by FOREIGN KEY (changed_by) REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

CREATE TABLE password_policy_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    min_length INT NOT NULL DEFAULT 12,
    min_numbers INT NOT NULL DEFAULT 2,
    min_uppercase INT NOT NULL DEFAULT 1,
    min_special_chars INT NOT NULL DEFAULT 1,
    min_lowercase INT NOT NULL DEFAULT 1,
    min_unique_chars INT NOT NULL DEFAULT 8,
    max_password_age_days INT NOT NULL DEFAULT 90,
    min_password_history INT NOT NULL DEFAULT 5,
    min_password_age_history_days INT NOT NULL DEFAULT 450, -- mínimo días entre cambios

    changed_by INT NOT NULL, -- ID del usuario que hizo el cambio
    changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_changed_by FOREIGN KEY (changed_by) REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);
CREATE TABLE user_roles (
    user_id INT NOT NULL,
    role_id INT NOT NULL,
    PRIMARY KEY (user_id, role_id),
    CONSTRAINT fk_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_role
        FOREIGN KEY (role_id) REFERENCES roles(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
); 





/*

*/


-- Inserta permisos (solo el id se genera)
INSERT INTO permissions () VALUES (); -- 1
INSERT INTO permissions () VALUES (); -- 2
INSERT INTO permissions () VALUES (); -- 3
INSERT INTO permissions () VALUES (); -- 4
INSERT INTO permissions () VALUES (); -- 5
INSERT INTO permissions () VALUES (); -- 6
INSERT INTO permissions () VALUES (); -- 7
INSERT INTO permissions () VALUES (); -- 8
INSERT INTO permissions () VALUES ();

-- Ahora insertamos las traducciones con sus permission_id generados

-- 1. Crear usuario
INSERT INTO permission_translations (permission_id, lang_code, name, description) VALUES
(1, 'es', 'Crear usuario', 'Permite crear un nuevo usuario'),
(1, 'en', 'Create User', 'Allows creating a new user');

-- 2. Activar / Desactivar usuario
INSERT INTO permission_translations (permission_id, lang_code, name, description) VALUES
(2, 'es', 'Activar o desactivar usuario', 'Permite activar o desactivar un usuario'),
(2, 'en', 'Activate or Deactivate User', 'Allows activating or deactivating a user');

-- 3. Borrar usuario
INSERT INTO permission_translations (permission_id, lang_code, name, description) VALUES
(3, 'es', 'Borrar usuario', 'Permite eliminar un usuario'),
(3, 'en', 'Delete User', 'Allows deleting a user');

-- 4. Crear roles
INSERT INTO permission_translations (permission_id, lang_code, name, description) VALUES
(4, 'es', 'Crear roles', 'Permite crear nuevos roles'),
(4, 'en', 'Create Roles', 'Allows creating new roles');

-- 5. Borrar roles
INSERT INTO permission_translations (permission_id, lang_code, name, description) VALUES
(5, 'es', 'Borrar roles', 'Permite eliminar roles'),
(5, 'en', 'Delete Roles', 'Allows deleting roles');

-- 6. Asignar roles
INSERT INTO permission_translations (permission_id, lang_code, name, description) VALUES
(6, 'es', 'Asignar roles', 'Permite asignar roles a usuarios'),
(6, 'en', 'Assign Roles', 'Allows assigning roles to users');

-- 7. Modificar roles
INSERT INTO permission_translations (permission_id, lang_code, name, description) VALUES
(7, 'es', 'Modificar roles', 'Permite modificar roles existentes'),
(7, 'en', 'Modify Roles', 'Allows modifying existing roles');

INSERT INTO permission_translations (permission_id, lang_code, name, description) VALUES
(8, 'es', 'Actualizar configuración', 'Permite modificar la configuración del sistema'),
(8, 'en', 'Update Configuration', 'Allows modifying the system configuration');

INSERT INTO roles (name) VALUES ('master');

CREATE TABLE user_roles_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    role_id INT NOT NULL,
    action ENUM('assigned', 'removed') NOT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    changed_by INT, -- Usuario que hizo el cambio
    
    FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
        
    FOREIGN KEY (role_id) REFERENCES roles(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
        
    FOREIGN KEY (changed_by) REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);


/*
CREATE TABLE user_permissions (
    user_id INT NOT NULL,
    permission_id INT NOT NULL,
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, permission_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

*/
CREATE TABLE systems (
    id INT PRIMARY KEY AUTO_INCREMENT NOT NULL,
    system_name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deactivated_at TIMESTAMP DEFAULT NULL,
    created_by INT NOT NULL,
    deactivated_by INT DEFAULT NULL,

    CONSTRAINT fk_system_creator
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_system_deactivator
        FOREIGN KEY (deactivated_by)
        REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);


CREATE TABLE containers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    system_id INT NOT NULL,
    capacity DECIMAL(10,2) NOT NULL,
    crop VARCHAR(150) NOT NULL,
    added_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deactivated_at TIMESTAMP DEFAULT NULL,
    added_by INT NOT NULL,
    deactivated_by INT DEFAULT NULL,

    CONSTRAINT fk_container_system
        FOREIGN KEY (system_id)
        REFERENCES systems(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_container_creator
        FOREIGN KEY (added_by)
        REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_container_deactivator
        FOREIGN KEY (deactivated_by)
        REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);


CREATE TABLE system_users_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    system_id INT NOT NULL,
    user_id INT NOT NULL,
    added_by INT NOT NULL,
    removed_by INT DEFAULT NULL,
    date_added TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    date_removed TIMESTAMP DEFAULT NULL,

    CONSTRAINT fk_su_hist_system
        FOREIGN KEY (system_id)
        REFERENCES systems(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_su_hist_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_su_hist_added_by
        FOREIGN KEY (added_by)
        REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_su_hist_removed_by
        FOREIGN KEY (removed_by)
        REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);
CREATE TABLE system_users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    system_id INT NOT NULL,
    user_id INT NOT NULL,
   added_by INT NOT NULL,
    date_added TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

 CONSTRAINT fk_su_system
        FOREIGN KEY (system_id)
        REFERENCES systems(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    
      CONSTRAINT fk_su_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_su_added_by
        FOREIGN KEY (added_by)
        REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);



CREATE TABLE user_password_history (
    id INT PRIMARY KEY AUTO_INCREMENT NOT NULL,
    user_id INT NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    changed_by INT NOT NULL,
    device VARCHAR(255),
    ip_address VARCHAR(15),
    mac_address VARCHAR(17),

    CONSTRAINT fk_password_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_password_changed_by
        FOREIGN KEY (changed_by) REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

CREATE TABLE user_email_changes (
    id INT PRIMARY KEY AUTO_INCREMENT NOT NULL,
    user_id INT NOT NULL,
    old_email VARCHAR(255) NOT NULL,
    new_email VARCHAR(255) NOT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    changed_by INT NOT NULL,
    device VARCHAR(255),
    ip_address VARCHAR(15),
    mac_address VARCHAR(17),

    CONSTRAINT fk_email_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_email_changed_by
        FOREIGN KEY (changed_by) REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

CREATE TABLE user_sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    token VARCHAR(512) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    revoked_at TIMESTAMP,
    revoked_reason VARCHAR(255),
    revoked_by INT,  -- quién revocó la sesión
    revoked_device VARCHAR(255),
    revoked_ip VARCHAR(39),
    revoked_user_agent TEXT,
    ip_addresses JSON,  -- guarda todas las IPs usadas en sesión
    user_agent TEXT,
    device VARCHAR(255),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (revoked_by) REFERENCES users(id) ON DELETE SET NULL
);


-- Bloqueo para la tabla permissions
CREATE TRIGGER bloqueo_update_permissions
BEFORE UPDATE ON permissions
FOR EACH ROW
SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Modification of the permissions table is prohibited';

CREATE TRIGGER bloqueo_delete_permissions
BEFORE DELETE ON permissions
FOR EACH ROW
SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Deletion from the permissions table is prohibited';

CREATE TRIGGER bloqueo_insert_permissions
BEFORE INSERT ON permissions
FOR EACH ROW
SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Insertion into the permissions table is prohibited';

-- Bloqueo para la tabla permission_translations
CREATE TRIGGER bloqueo_update_permission_translations
BEFORE UPDATE ON permission_translations
FOR EACH ROW
SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Modification of the permission_translations table is prohibited';

CREATE TRIGGER bloqueo_delete_permission_translations
BEFORE DELETE ON permission_translations
FOR EACH ROW
SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Deletion from the permission_translations table is prohibited';

CREATE TRIGGER bloqueo_insert_permission_translations
BEFORE INSERT ON permission_translations
FOR EACH ROW
SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Insertion into the permission_translations table is prohibited';


DELIMITER $$

CREATE TRIGGER prevent_delete_master_role
BEFORE DELETE ON roles
FOR EACH ROW
BEGIN
    IF OLD.name = 'master' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'The master role cannot be deleted';
    END IF;
END$$

DELIMITER ;

-- Bloqueo de INSERT en config
CREATE TRIGGER bloqueo_insert_config
BEFORE INSERT ON config
FOR EACH ROW
SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Insertion into the config table is prohibited';

-- Bloqueo de DELETE en config
CREATE TRIGGER bloqueo_delete_config
BEFORE DELETE ON config
FOR EACH ROW
SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Deletion from the config table is prohibited';

-- Bloqueo de INSERT en config_translations
CREATE TRIGGER bloqueo_insert_config_translations
BEFORE INSERT ON config_translations
FOR EACH ROW
SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Insertion into the config_translations table is prohibited';

-- Bloqueo de DELETE en config_translations
CREATE TRIGGER bloqueo_delete_config_translations
BEFORE DELETE ON config_translations
FOR EACH ROW
SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Deletion from the config_translations table is prohibited';



DELIMITER $$

CREATE TRIGGER trg_validate_config_values BEFORE INSERT ON config
FOR EACH ROW
BEGIN
    IF NEW.id = 1 THEN -- Max login attempts
        IF NEW.value < 3 THEN
            SIGNAL SQLSTATE '45001'
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
    END IF;
END$$

DELIMITER ;
