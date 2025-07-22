
USE hydrosyn_db;

-- configuraciones modificar, dividir modi
-- crear usuarios borrar 
CREATE TABLE IF NOT EXISTS roles (
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by INT UNSIGNED NOT NULL,
    FOREIGN KEY (created_by) REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT chk_name_letters_only CHECK (name REGEXP '^[A-Za-z]+$')
) ENGINE=InnoDB;

INSERT INTO roles (name, created_by)
VALUES (
    'admin',
    (SELECT id FROM users WHERE username = 'system')
);


DELIMITER $$

-- Trigger to prevent deleting the 'admin' role
CREATE TRIGGER prevent_admin_delete
BEFORE DELETE ON roles
FOR EACH ROW
BEGIN
    IF OLD.name = 'admin' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'The admin role cannot be deleted.';
    END IF;
END$$

-- Trigger to prevent updating the 'admin' role
CREATE TRIGGER prevent_admin_update
BEFORE UPDATE ON roles
FOR EACH ROW
BEGIN
    IF OLD.name = 'admin' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'The admin role cannot be modified.';
    END IF;
END$$

DELIMITER ;
DELIMITER $$

CREATE PROCEDURE reorganize_role_ids()
BEGIN      
    DECLARE done INT DEFAULT FALSE;
    DECLARE old_id, new_id, max_id INT UNSIGNED;
    DECLARE update_count INT DEFAULT 0;
    DECLARE id_cursor CURSOR FOR SELECT id FROM roles ORDER BY id;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    -- Start transaction
    START TRANSACTION;

    -- Initialize counter
    SET new_id = 1;

    -- Open cursor
    OPEN id_cursor;

    read_loop: LOOP
        FETCH id_cursor INTO old_id;
        IF done THEN
            LEAVE read_loop;
        END IF;

        IF old_id != new_id THEN
            -- Check for ID conflict
            SET @id_exists = 0;
            SELECT COUNT(*) INTO @id_exists FROM roles WHERE id = new_id;

            IF @id_exists = 0 THEN
                -- Update the ID
                UPDATE roles SET id = new_id WHERE id = old_id;
                SET update_count = update_count + 1;
            END IF;
        END IF;

        SET new_id = new_id + 1;
    END LOOP;

    CLOSE id_cursor;

    -- Adjust AUTO_INCREMENT to next available ID
    SELECT IFNULL(MAX(id), 0) + 1 INTO max_id FROM roles;
    SET @stmt = CONCAT('ALTER TABLE roles AUTO_INCREMENT = ', max_id);
    PREPARE stmt FROM @stmt;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;

    COMMIT;
END$$
DELIMITER ;





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

INSERT INTO permissions_groups () VALUES (); -- id = 3
INSERT INTO permissions_group_translations (group_id, lang_code, name) VALUES
(3, 'es', 'Permisos de notificaciones'),
(3, 'en', 'Notification permissions');

INSERT INTO permissions_groups () VALUES (); -- id = 4
INSERT INTO permissions_group_translations (group_id, lang_code, name) VALUES
(4, 'es', 'Permisos de roles'),
(4, 'en', 'Role permissions');

INSERT INTO permissions_groups () VALUES (); -- id = 5


INSERT INTO permissions_group_translations (group_id, lang_code, name) VALUES
(5, 'es', 'Permisos de sistema'),
(5, 'en', 'System permissions');


DELIMITER $$

-- permissions_groups no insert/update/delete
CREATE TRIGGER trg_permissions_groups_no_insert
BEFORE INSERT ON permissions_groups
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Inserts are not allowed on permissions_groups';
END$$

CREATE TRIGGER trg_permissions_groups_no_update
BEFORE UPDATE ON permissions_groups
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Updates are not allowed on permissions_groups';
END$$

CREATE TRIGGER trg_permissions_groups_no_delete
BEFORE DELETE ON permissions_groups
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Deletes are not allowed on permissions_groups';
END$$

-- permissions_group_translations no insert/update/delete
CREATE TRIGGER trg_permissions_group_translations_no_insert
BEFORE INSERT ON permissions_group_translations
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Inserts are not allowed on permissions_group_translations';
END$$

CREATE TRIGGER trg_permissions_group_translations_no_update
BEFORE UPDATE ON permissions_group_translations
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Updates are not allowed on permissions_group_translations';
END$$

CREATE TRIGGER trg_permissions_group_translations_no_delete
BEFORE DELETE ON permissions_group_translations
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Deletes are not allowed on permissions_group_translations';
END$$

DELIMITER ;



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



INSERT INTO permissions (group_id) VALUES
(1), (1), (1), (1), (1), (1), (1), (1), (1), (1), (1);

-- Asumiendo que los IDs de permisos empiezan en 1 y son auto_increment, y se insertaron 14 permisos para grupo 1.

INSERT INTO permission_translations (permission_id, lang_code, name, description) VALUES
-- permiso 1
(1, 'es', 'Ver configuración', 'Permiso para ver la configuración'),
(1, 'en', 'View configuration', 'Permission to view configuration'),

-- permiso 2
(2, 'es', 'Editar configuración', 'Permiso para editar la configuración'),
(2, 'en', 'Edit configuration', 'Permission to edit configuration'),

-- permiso 3
(3, 'es', 'Ver nombres lista negra', 'Permiso para ver los nombres en lista negra'),
(3, 'en', 'View blacklist names', 'Permission to view blacklist names'),

-- permiso 4
(4, 'es', 'Añadir nombres lista negra', 'Permiso para añadir nombres a la lista negra'),
(4, 'en', 'Add blacklist names', 'Permission to add names to blacklist'),

-- permiso 5
(5, 'es', 'Eliminar nombres lista negra', 'Permiso para eliminar nombres de la lista negra'),
(5, 'en', 'Remove blacklist names', 'Permission to remove names from blacklist'),

-- permiso 6
(6, 'es', 'Ver política de nombres', 'Permiso para ver la política de nombres'),
(6, 'en', 'View naming policy', 'Permission to view naming policy'),

-- permiso 7
(7, 'es', 'Cambiar política de nombres', 'Permiso para cambiar la política de nombres'),
(7, 'en', 'Change naming policy', 'Permission to change naming policy'),

-- permiso 8
(8, 'es', 'Ver política de contraseñas', 'Permiso para ver la política de contraseñas'),
(8, 'en', 'View password policy', 'Permission to view password policy'),

-- permiso 9
(9, 'es', 'Cambiar política de contraseñas', 'Permiso para cambiar la política de contraseñas'),
(9, 'en', 'Change password policy', 'Permission to change password policy'),

-- permiso 10
(10, 'es', 'Ver IDs base de datos', 'Permiso para ver los IDs de la base de datos'),
(10, 'en', 'View database IDs', 'Permission to view database IDs'),

-- permiso 11
(11, 'es', 'Reajustar IDs base de datos', 'Permiso para reajustar los IDs de la base de datos'),
(11, 'en', 'Reset database IDs', 'Permission to reset database IDs');



-- INSERT permisos en grupo 2: Permisos de usuarios
INSERT INTO permissions (group_id) VALUES
(2), (2), (2), (2), (2), (2), (2);



INSERT INTO permission_translations (permission_id, lang_code, name, description) VALUES
(12, 'es', 'Crear usuario', 'Permiso para crear usuarios'),
(12, 'en', 'Create user', 'Permission to create users'),

(13, 'es', 'Borrar usuario', 'Permiso para borrar usuarios'),
(13, 'en', 'Delete user', 'Permission to delete users'),

(14, 'es', 'Consultar usuarios', 'Permiso para consultar usuarios'),
(14, 'en', 'View users', 'Permission to view users'),

(15, 'es', 'Activar/desactivar usuarios', 'Permiso para activar o desactivar usuarios'),
(15, 'en', 'Activate/deactivate users', 'Permission to activate or deactivate users'),

(16, 'es', 'Cambiar contraseña y nombre usuario', 'Permiso para cambiar la contraseña y nombre de un usuario'),
(16, 'en', 'Change user password and username', 'Permission to change user password and username'),

(17, 'es', 'Activar/desactivar 2FA', 'Permiso para activar o desactivar la autenticación de dos factores'),
(17, 'en', 'Activate/deactivate 2FA', 'Permission to activate or deactivate two-factor authentication'),

(18, 'es', 'Cambiar correo', 'Permiso para cambiar el correo electrónico del usuario'),
(18, 'en', 'Change email', 'Permission to change user email');


-- INSERT permisos en grupo 3: Permisos de notificaciones
INSERT INTO permissions (group_id) VALUES
(3), (3);

-- IDs 22 y 23

INSERT INTO permission_translations (permission_id, lang_code, name, description) VALUES
(19, 'es', 'Ver notificaciones', 'Permiso para ver notificaciones'),
(19, 'en', 'View notifications', 'Permission to view notifications'),

(20, 'es', 'Gestionar notificaciones por email', 'Permiso para decidir qué notificaciones se envían por correo y cambiar correo de notificaciones'),
(20, 'en', 'Manage email notifications', 'Permission to decide which notifications are sent by email and change notification email');


-- INSERT permisos en grupo 4: Permisos de roles
INSERT INTO permissions (group_id) VALUES
(4), (4), (4), (4), (4), (4), (4), (4);

-- IDs 24 a 31

INSERT INTO permission_translations (permission_id, lang_code, name, description) VALUES
(21, 'es', 'Crear rol', 'Permiso para crear roles'),
(21, 'en', 'Create role', 'Permission to create roles'),

(22, 'es', 'Consultar rol', 'Permiso para consultar roles'),
(22, 'en', 'View role', 'Permission to view roles'),

(23, 'es', 'Modificar rol', 'Permiso para modificar roles'),
(23, 'en', 'Modify role', 'Permission to modify roles'),

(24, 'es', 'Cambiar nombre rol', 'Permiso para cambiar el nombre de un rol'),
(24, 'en', 'Change role name', 'Permission to change role name'),

(25, 'es', 'Borrar rol', 'Permiso para borrar roles'),
(25, 'en', 'Delete role', 'Permission to delete roles'),

(26, 'es', 'Asociar roles a usuarios', 'Permiso para asociar roles a usuarios'),
(26, 'en', 'Assign roles to users', 'Permission to assign roles to users'),

(27, 'es', 'Borrar roles a usuarios', 'Permiso para borrar roles a usuarios'),
(27, 'en', 'Remove roles from users', 'Permission to remove roles from users'),

(28, 'es', 'Consultar roles de usuarios', 'Permiso para consultar roles asignados a usuarios'),
(28, 'en', 'View user roles', 'Permission to view user roles');





















CREATE TRIGGER block_update_permissions
BEFORE UPDATE ON permissions
FOR EACH ROW
SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Modification of the permissions table is prohibited';

CREATE TRIGGER block_delete_permissions
BEFORE DELETE ON permissions
FOR EACH ROW
SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Deletion from the permissions table is prohibited';

CREATE TRIGGER block_insert_permissions
BEFORE INSERT ON permissions
FOR EACH ROW
SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Insertion into the permissions table is prohibited';


CREATE TRIGGER block_update_permission_translations
BEFORE UPDATE ON permission_translations
FOR EACH ROW
SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Modification of the permission_translations table is prohibited';

CREATE TRIGGER block_delete_permission_translations
BEFORE DELETE ON permission_translations
FOR EACH ROW
SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Deletion from the permission_translations table is prohibited';

CREATE TRIGGER block_insert_permission_translations
BEFORE INSERT ON permission_translations
FOR EACH ROW
SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Insertion into the permission_translations table is prohibited';












CREATE TABLE IF NOT EXISTS role_permissions (
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    role_id INT UNSIGNED NOT NULL,
    permission_id INT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by INT UNSIGNED NOT NULL,

    UNIQUE (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE RESTRICT ON UPDATE CASCADE

) ENGINE=InnoDB;


INSERT INTO role_permissions (role_id, permission_id, created_by)
SELECT r.id, p.id, u.id
FROM roles r
CROSS JOIN permissions p
CROSS JOIN users u
WHERE r.name = 'admin' AND u.username = 'system';

DELIMITER $$

CREATE TRIGGER trg_block_role_permissions_delete
BEFORE DELETE ON role_permissions
FOR EACH ROW
BEGIN
    DECLARE role_name VARCHAR(50);
    SELECT name INTO role_name FROM roles WHERE id = OLD.role_id AND permission_id = OLD.permission_id;
    
    IF role_name = 'admin' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot delete permissions from the admin role.';
    END IF;
END$$


CREATE TRIGGER trg_block_role_permissions_update
BEFORE UPDATE ON role_permissions
FOR EACH ROW
BEGIN
    DECLARE role_name VARCHAR(50);
    SELECT name INTO role_name FROM roles WHERE id = OLD.role_id AND permission_id = OLD.permission_id;
    
    IF role_name = 'admin' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot update permissions of the admin role.';
    END IF;
END$$


DELIMITER ;
DELIMITER $$
CREATE PROCEDURE reorganize_role_permissions_ids()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE old_id, new_id, max_id INT UNSIGNED;
    DECLARE update_count INT DEFAULT 0;
    DECLARE id_cursor CURSOR FOR SELECT id FROM role_permissions ORDER BY id;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    -- Start transaction
    START TRANSACTION;

    -- Initialize counter
    SET new_id = 1;

    -- Open cursor
    OPEN id_cursor;

    read_loop: LOOP
        FETCH id_cursor INTO old_id;
        IF done THEN
            LEAVE read_loop;
        END IF;

        IF old_id != new_id THEN
            -- Check for ID conflict
            SET @id_exists = 0;
            SELECT COUNT(*) INTO @id_exists FROM role_permissions WHERE id = new_id;

            IF @id_exists = 0 THEN
                -- Update the ID
                UPDATE role_permissions SET id = new_id WHERE id = old_id;
                SET update_count = update_count + 1;
            END IF;
        END IF;

        SET new_id = new_id + 1;
    END LOOP;

    CLOSE id_cursor;

    -- Adjust AUTO_INCREMENT to next available ID
    SELECT IFNULL(MAX(id), 0) + 1 INTO max_id FROM role_permissions;
    SET @stmt = CONCAT('ALTER TABLE role_permissions AUTO_INCREMENT = ', max_id);
    PREPARE stmt FROM @stmt;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;

    COMMIT;
END$$
DELIMITER ;

CREATE TABLE IF NOT EXISTS role_permissions_history (
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    role_id INT UNSIGNED NOT NULL,
    permission_id INT UNSIGNED NOT NULL,
    
    created_by INT UNSIGNED NOT NULL,
    created_at TIMESTAMP NOT NULL,
    
    deleted_by INT UNSIGNED NOT NULL,
    deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
     CONSTRAINT chk_deleted_after_created
CHECK (deleted_at > created_at),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;



DELIMITER $$

CREATE TRIGGER check_role_permission_history_insert
BEFORE INSERT ON role_permissions_history
FOR EACH ROW
BEGIN
    DECLARE last_deleted_at TIMESTAMP;

    
    SELECT deleted_at INTO last_deleted_at
    FROM role_permissions_history
    WHERE role_id = NEW.role_id
      AND permission_id = NEW.permission_id
    ORDER BY deleted_at DESC
    LIMIT 1;

   
    IF last_deleted_at IS NOT NULL AND last_deleted_at >= NEW.created_at THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot insert: deleted_at of last record must be earlier than new created_at.';
    END IF;
END$$

DELIMITER ;
DELIMITER $$

CREATE TRIGGER trg_prevent_delete_role_permissions_history_before_time
BEFORE DELETE ON role_permissions_history   
FOR EACH ROW
BEGIN
    DECLARE retention_period INT;
    DECLARE allowed_date TIMESTAMP;
    SELECT value INTO retention_period FROM config WHERE id = 23;
    SET allowed_date = DATE_ADD(OLD.deleted_at, INTERVAL retention_period DAY);

   
    IF NOW() < allowed_date THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot delete record before retention period expires.';
    END IF;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE reorganize_role_permissions_history_ids()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE old_id, new_id, max_id INT UNSIGNED;
    DECLARE update_count INT DEFAULT 0;
    DECLARE id_cursor CURSOR FOR SELECT id FROM role_permissions_history ORDER BY id;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    -- Start transaction
    START TRANSACTION;

    -- Initialize counter
    SET new_id = 1;

    -- Open cursor
    OPEN id_cursor;

    read_loop: LOOP
        FETCH id_cursor INTO old_id;
        IF done THEN
            LEAVE read_loop;
        END IF;

        IF old_id != new_id THEN
            -- Check for ID conflict
            SET @id_exists = 0;
            SELECT COUNT(*) INTO @id_exists FROM role_permissions_history WHERE id = new_id;

            IF @id_exists = 0 THEN
                -- Update the ID
                UPDATE role_permissions_history SET id = new_id WHERE id = old_id;
                SET update_count = update_count + 1;
            END IF;
        END IF;

        SET new_id = new_id + 1;
    END LOOP;

    CLOSE id_cursor;

    -- Adjust AUTO_INCREMENT to next available ID
    SELECT IFNULL(MAX(id), 0) + 1 INTO max_id FROM role_permissions_history;
    SET @stmt = CONCAT('ALTER TABLE role_permissions_history AUTO_INCREMENT = ', max_id);
    PREPARE stmt FROM @stmt;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;

    COMMIT;
END$$
DELIMITER ;

    




CREATE TABLE user_roles (
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNSIGNED NOT NULL,
    role_id INT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
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

DELIMITER $$
CREATE TRIGGER trg_block_insert_user_roles
BEFORE INSERT ON user_roles
FOR EACH ROW
BEGIN
    DECLARE role_name VARCHAR(50);
    DECLARE user_count INT;
    SELECT name INTO role_name FROM roles WHERE id = NEW.role_id;

    IF role_name = 'admin' THEN
        
        SELECT COUNT(*) INTO user_count FROM user_roles WHERE role_id = NEW.role_id;

        IF user_count > 0 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Only one user can have the admin role.';
        END IF;
    END IF;
END$$

DELIMITER ;

DELIMITER $$

CREATE TRIGGER trg_block_delete_user_roles
BEFORE DELETE ON user_roles
FOR EACH ROW
BEGIN
    DECLARE role_name VARCHAR(50);
    SELECT name INTO role_name FROM roles WHERE id = OLD.role_id;

    IF role_name = 'admin' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot delete the admin role from a user.';
    END IF;
END$$

DELIMITER ;

CREATE TABLE user_roles_history (
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNSIGNED NOT NULL,
    role_id INT UNSIGNED NOT NULL,
    created_at TIMESTAMP NOT NULL,
    created_by INT UNSIGNED NOT NULL,
    deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_by INT UNSIGNED NOT NULL,
   CHECK (deleted_at > created_at),
    
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


DELIMITER $$

CREATE TRIGGER trg_check_user_roles_history_insert
BEFORE INSERT ON user_roles_history
FOR EACH ROW
BEGIN
    DECLARE last_deleted_at TIMESTAMP;

    -- Buscar el deleted_at más reciente para ese rol y permiso
    SELECT deleted_at INTO last_deleted_at
    FROM user_roles_history
    WHERE role_id = NEW.role_id
      AND user_id = NEW.user_id
    ORDER BY deleted_at DESC
    LIMIT 1;

    -- Verificar si el último deleted_at no es anterior al nuevo created_at
    IF last_deleted_at IS NOT NULL AND last_deleted_at >= NEW.created_at THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot insert: deleted_at of last record must be earlier than new created_at.';
    END IF;
END$$

DELIMITER ;

DELIMITER $$
CREATE TRIGGER trg_prevent_delete_user_roles_history_before_time
BEFORE DELETE ON user_roles_history
FOR EACH ROW
BEGIN
    DECLARE retention_period INT;
    DECLARE allowed_date TIMESTAMP;
    SELECT value INTO retention_period FROM config WHERE id = 24;
    SET allowed_date = DATE_ADD(OLD.deleted_at, INTERVAL retention_period DAY);

    --
    IF NOW() < allowed_date THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot delete record before retention period expires.';
    END IF;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE reorganize_user_roles_history_ids()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE old_id, new_id, max_id INT UNSIGNED;
    DECLARE update_count INT DEFAULT 0;
    DECLARE id_cursor CURSOR FOR SELECT id FROM user_roles_history ORDER BY id;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    -- Start transaction
    START TRANSACTION;

    -- Initialize counter
    SET new_id = 1;

    -- Open cursor
    OPEN id_cursor;

    read_loop: LOOP
        FETCH id_cursor INTO old_id;
        IF done THEN
            LEAVE read_loop;
        END IF;

        IF old_id != new_id THEN
            -- Check for ID conflict
            SET @id_exists = 0;
            SELECT COUNT(*) INTO @id_exists FROM user_roles_history WHERE id = new_id;

            IF @id_exists = 0 THEN
                -- Update the ID
                UPDATE user_roles_history SET id = new_id WHERE id = old_id;
                SET update_count = update_count + 1;
            END IF;
        END IF;

        SET new_id = new_id + 1;
    END LOOP;

    CLOSE id_cursor;

    -- Adjust AUTO_INCREMENT to next available ID
    SELECT IFNULL(MAX(id), 0) + 1 INTO max_id FROM user_roles_history;
    SET @stmt = CONCAT('ALTER TABLE user_roles_history AUTO_INCREMENT = ', max_id);
    PREPARE stmt FROM @stmt;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;

    COMMIT;
END$$
DELIMITER ;


DELIMITER $$

-- Trigger to prevent admin user deletion
CREATE TRIGGER trg_prevent_admin_user_deletion
BEFORE DELETE ON users
FOR EACH ROW
BEGIN
    DECLARE is_admin INT;
    
    -- Check if user has admin role
    SELECT COUNT(*) INTO is_admin 
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = OLD.id AND r.name = 'admin';
    
    IF is_admin > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot delete a user with admin role';
    END IF;
END$$

-- Trigger to prevent admin user deactivation
CREATE TRIGGER trg_prevent_admin_user_deactivate
BEFORE UPDATE ON users
FOR EACH ROW
BEGIN
    DECLARE is_admin INT;
    
    -- Check if user has admin role
    SELECT COUNT(*) INTO is_admin 
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = NEW.id AND r.name = 'admin';
    
    -- Prevent changing is_active to FALSE
    IF is_admin > 0 AND NEW.is_active = FALSE AND OLD.is_active = TRUE THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot deactivate an admin user';
    END IF;
    
    -- Prevent changing first_login to FALSE
    IF is_admin > 0 AND NEW.first_login = FALSE AND OLD.first_login = TRUE THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot change first_login to FALSE for an admin';
    END IF;
    
    -- Prevent enabling delete_possible
    IF is_admin > 0 AND NEW.delete_possible = TRUE AND OLD.delete_possible = FALSE THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot enable deletion for an admin user';
    END IF;
END$$

DELIMITER ;