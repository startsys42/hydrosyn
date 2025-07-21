CREATE DATABASE IF NOT EXISTS hydrosyn_db CHARACTER SET utf8mb4 COLLATE  utf8mb4_bin;
USE hydrosyn_db;

-- CONFIGURAR BORRA USUARIO SIN PRIEMR LOGIN TIEMPO Y  NOTIFICAR , borrra y notificar 2fa fallido al activar




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


CREATE TRIGGER trg_block_insert_config_groups
BEFORE INSERT ON config_groups
FOR EACH ROW
SIGNAL SQLSTATE '11000' SET MESSAGE_TEXT = 'Insertion into the config_groups table is prohibited';


CREATE TRIGGER trg_block_delete_config_groups
BEFORE DELETE ON config_groups
FOR EACH ROW
SIGNAL SQLSTATE '12000' SET MESSAGE_TEXT = 'Deletion from the config_groups table is prohibited';


CREATE TRIGGER trg_block_update_config_groups
BEFORE UPDATE ON config_groups
FOR EACH ROW
SIGNAL SQLSTATE '13000' SET MESSAGE_TEXT = 'Updation from the config_groups table is prohibited';


CREATE TRIGGER trg_block_insert_config_groups_translations
BEFORE INSERT ON config_group_translations
FOR EACH ROW
SIGNAL SQLSTATE '21000' SET MESSAGE_TEXT = 'Insertion into the config_group_translations table is prohibited';


CREATE TRIGGER trg_block_delete_config_groups_translations
BEFORE DELETE ON config_group_translations
FOR EACH ROW
SIGNAL SQLSTATE '22000' SET MESSAGE_TEXT = 'Deletion from the config_group_translations table is prohibited';


CREATE TRIGGER trg_block_update_config_groups_translations
BEFORE UPDATE ON config_group_translations
FOR EACH ROW
SIGNAL SQLSTATE '23000' SET MESSAGE_TEXT = 'Updation from the config_group_translations table is prohibited';
