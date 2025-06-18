CREATE DATABASE IF NOT EXISTS hydrosyn_db CHARACTER SET utf8mb4 COLLATE  utf8mb4_bin;
USE hydrosyn_db;

CREATE TABLE permissions (
    id INT PRIMARY KEY AUTO_INCREMENT,
                 
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
    name VARCHAR(100) NOT NULL UNIQUE,
 
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
    was_actived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by INT NOT NULL,
     language ENUM('es', 'en') NOT NULL DEFAULT 'en',
    theme ENUM('dark', 'light') NOT NULL DEFAULT 'light',
    CONSTRAINT fk_user_creator
        FOREIGN KEY (created_by)
        REFERENCES users(id)
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
INSERT INTO permissions () VALUES ();
INSERT INTO permissions () VALUES ();
INSERT INTO permissions () VALUES ();
INSERT INTO permissions () VALUES ();
INSERT INTO permissions () VALUES ();
INSERT INTO permissions () VALUES ();
INSERT INTO permissions () VALUES ();

-- Ahora insertamos las traducciones con sus permission_id generados
-- Para saber los ids, usa LAST_INSERT_ID() o selecciona con SELECT id FROM permissions;

-- Supongamos que los ids son del 1 al 7 para cada permiso:

-- 1. Crear usuario
INSERT INTO permission_translations (permission_id, lang_code, name, description) VALUES
(1, 'es', 'Crear usuario', 'Permite crear un nuevo usuario'),
(1, 'en', 'Create User', 'Allows creating a new user');

-- 2. Desactivar usuario
INSERT INTO permission_translations (permission_id, lang_code, name, description) VALUES
(2, 'es', 'Desactivar usuario', 'Permite desactivar un usuario'),
(2, 'en', 'Deactivate User', 'Allows deactivating a user');

-- 3. Activar usuario
INSERT INTO permission_translations (permission_id, lang_code, name, description) VALUES
(3, 'es', 'Activar usuario', 'Permite activar un usuario'),
(3, 'en', 'Activate User', 'Allows activating a user');

-- 4. Borrar usuario
INSERT INTO permission_translations (permission_id, lang_code, name, description) VALUES
(4, 'es', 'Borrar usuario', 'Permite eliminar un usuario'),
(4, 'en', 'Delete User', 'Allows deleting a user');

-- 5. Crear roles
INSERT INTO permission_translations (permission_id, lang_code, name, description) VALUES
(5, 'es', 'Crear roles', 'Permite crear nuevos roles'),
(5, 'en', 'Create Roles', 'Allows creating new roles');

-- 6. Borrar roles
INSERT INTO permission_translations (permission_id, lang_code, name, description) VALUES
(6, 'es', 'Borrar roles', 'Permite eliminar roles'),
(6, 'en', 'Delete Roles', 'Allows deleting roles');

-- 7. Asignar roles
INSERT INTO permission_translations (permission_id, lang_code, name, description) VALUES
(7, 'es', 'Asignar roles', 'Permite asignar roles a usuarios'),
(7, 'en', 'Assign Roles', 'Allows assigning roles to users');

-- 8. Modificar roles
INSERT INTO permission_translations (permission_id, lang_code, name, description) VALUES
(8, 'es', 'Modificar roles', 'Permite modificar roles existentes'),
(8, 'en', 'Modify Roles', 'Allows modifying existing roles');

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
        ON DELETE SET NULL -- en caso de que se elimine el usuario que hizo el cambio
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


CREATE TABLE system_users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    system_id INT NOT NULL,
    user_id INT NOT NULL,
    added_by INT NOT NULL,
    removed_by INT DEFAULT NULL,
    date_added TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    date_removed TIMESTAMP DEFAULT NULL,

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
        ON UPDATE CASCADE,

    CONSTRAINT fk_su_removed_by
        FOREIGN KEY (removed_by)
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

