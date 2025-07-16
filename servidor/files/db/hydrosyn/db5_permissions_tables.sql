CREATE DATABASE IF NOT EXISTS hydrosyn_db CHARACTER SET utf8mb4 COLLATE  utf8mb4_bin;
USE hydrosyn_db;

-- configuraciones modificar, dividir modi
-- crear usuarios borrar 
CREATE TABLE IF NOT EXISTS roles (
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT UNSIGNED NOT NULL,
    FOREIGN KEY (created_by) REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT chk_name_letters_only CHECK (name REGEXP '^[A-Za-z]+$')
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS roles_name_changes (
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    role_id INT NOT NULL,
    old_name VARCHAR(50) NOT NULL,
    new_name VARCHAR(50) NOT NULL,
    changed_by INT UNSIGNED NOT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_old_name_letters_only CHECK (old_name REGEXP '^[A-Za-z]+$'),
    CONSTRAINT chk_new_name_letters_only CHECK (new_name REGEXP '^[A-Za-z]+$')
) ENGINE=InnoDB;


CREATE TABLE IF NOT EXISTS permissions_groups (
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT

)ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS permissions_group_translations (
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    group_id INT UNSIGNED NOT NULL,
    lang_code ENUM('es', 'en') NOT NULL,
    name VARCHAR(100) NOT NULL UNIQUE,


    FOREIGN KEY (group_id) REFERENCES permissions_groups(id)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT,

    UNIQUE (group_id, lang_code)
)ENGINE=InnoDB;


INSERT INTO permissions_groups () VALUES ();
INSERT INTO permissions_group_translations (group_id, lang_code, name) VALUES
(1, 'es', 'Permisos de configuración'),
(1, 'en', 'Configuration permissions');

INSERT INTO permissions_groups () VALUES ();
INSERT INTO permissions_group_translations (group_id, lang_code, name) VALUES
(2, 'es', 'Permisos de usuarios'),
(2, 'en', 'User permissions');


CREATE TABLE permissions (
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    group_id INT UNSIGNED NOT NULL,
    CONSTRAINT fk_group
        FOREIGN KEY (group_id) REFERENCES permissions_groups(id)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT

)ENGINE=InnoDB;


CREATE TABLE permission_translations (
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    permission_id INT UNSIGNED NOT NULL,
    lang_code ENUM('es', 'en') NOT NULL,
    name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255) NOT NULL UNIQUE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT,

    UNIQUE (permission_id, lang_code)
)ENGINE=InnoDB;



CREATE TABLE IF NOT EXISTS role_permissions_history (
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    role_id INT UNSIGNED NOT NULL,
    permission_id INT UNSIGNED NOT NULL,
    
    created_by INT UNSIGNED NOT NULL,
    created_at TIMESTAMP NOT NULL,
    
    deleted_by INT UNSIGNED DEFAULT NULL,
    deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;





CREATE TABLE user_roles (
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNSIGNED NOT NULL,
    role_id INT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT UNSIGNED NOT NULL,
    UNIQUE (user_id, role_id),
    CONSTRAINT fk_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT fk_role
        FOREIGN KEY (role_id) REFERENCES roles(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
); 



CREATE TABLE user_roles_history (
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNSIGNED NOT NULL,
    role_id INT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT UNSIGNED NOT NULL,
    deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_by INT UNSIGNED DEFAULT NULL,
   
    
    FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
        
    FOREIGN KEY (role_id) REFERENCES roles(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
        
    FOREIGN KEY (created_by) REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    FOREIGN KEY (deleted_by) REFERENCES users(id)
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







