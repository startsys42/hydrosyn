CREATE DATABASE IF NOT EXISTS hydrosyn_db CHARACTER SET utf8mb4 COLLATE  utf8mb4_bin;
USE hydrosyn_db;
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






CREATE TABLE user_roles (
    user_id INT UNSIGNED NOT NULL,
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
    user_id INT UNSIGNED NOT NULL,
    role_id INT NOT NULL,
    action ENUM('assigned', 'removed') NOT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    changed_by INT UNSIGNED, -- Usuario que hizo el cambio
    
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

