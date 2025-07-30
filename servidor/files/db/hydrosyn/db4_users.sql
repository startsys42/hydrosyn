USE hydrosyn_db;



CREATE TABLE  IF NOT EXISTS  users(
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT NOT NULL,
    username VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,

    change_pass BOOLEAN NOT NULL DEFAULT FALSE,
    change_name BOOLEAN NOT NULL DEFAULT FALSE,
    delete_possible  BOOLEAN NOT NULL DEFAULT  FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by INT UNSIGNED NOT NULL,
    language ENUM('es', 'en') NOT NULL DEFAULT 'en',
    theme ENUM('dark', 'light') NOT NULL DEFAULT 'light',
    code_2fa VARCHAR(6) NULL,
 
    
  
     CONSTRAINT chk_username_alphanumeric CHECK (username REGEXP '^[a-zA-Z0-9]+$'),
     CONSTRAINT chk_username_complex 
CHECK (
  CHAR_LENGTH(username) >= 6 
  AND 
  (LENGTH(REGEXP_REPLACE(username, '[^a-zA-Z]', '')) >= 4)
)
   
   
    CONSTRAINT fk_user_creator
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
)ENGINE=InnoDB;



SET FOREIGN_KEY_CHECKS = 0;

-- Insertar usuario system con created_by temporal (0)
INSERT INTO users (
    username, email, password, is_active, first_login, delete_possible, created_by, language, theme, , ,
) VALUES (
    'system', 'system@example.com', 'hashed_password', FALSE, FALSE, FALSE, 0, 'en', 'light', FALSE, FALSE, NULL
);

-- Actualizar created_by para que apunte a sí mismo
UPDATE users u
JOIN (
    SELECT id FROM users WHERE username = 'system'
) AS sysUser ON u.username = 'system'
SET u.created_by = sysUser.id;

-- Reactivar chequeo de claves foráneas
SET FOREIGN_KEY_CHECKS = 1;
DELIMITER $$
CREATE TRIGGER prevent_system_update
BEFORE UPDATE ON users
FOR EACH ROW
BEGIN
    IF OLD.username = 'system' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'The system user cannot be modified';
    END IF;
END$$



CREATE TRIGGER prevent_system_delete
BEFORE DELETE ON users
FOR EACH ROW
BEGIN
    IF OLD.username = 'system' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'The system user cannot be deleted';
    END IF;
END$$

DELIMITER ;





CREATE TABLE IF NOT EXISTS username_blacklist (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(20) NOT NULL UNIQUE,
    added_by INT UNSIGNED,  -- Usuario que añadió el nombre
    added_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (added_by) REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB;

DELIMITER $$

CREATE TRIGGER trg_username_blacklist_before_insert
BEFORE INSERT ON username_blacklist
FOR EACH ROW
BEGIN
    DECLARE user_exists INT;

    SELECT COUNT(*) INTO user_exists
    FROM users
    WHERE username = NEW.username;

    IF user_exists > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Username already exists in users table';
    END IF;
END$$

DELIMITER ;

DELIMITER $$

CREATE TRIGGER trg_username_blacklist_prevent_update
BEFORE UPDATE ON username_blacklist
FOR EACH ROW
BEGIN
    IF NEW.username <> OLD.username THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Username in blacklist cannot be changed';
    END IF;
END$$

DELIMITER ;
INSERT INTO username_blacklist (username) VALUES
('admin'),
('administrator'),
('root'),
('superuser'),
('support'),
('helpdesk'),
('test'),
('guest'),
('info'),
('contact'),
('null'),
('user'),
('users'),
('security'),
('owner'),
('master'),
('webmaster'),
('api'),
('backend'),
('frontend');





CREATE TABLE login_attempts (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNSIGNED DEFAULT NULL,
    session_id VARCHAR(128) NOT NULL,
    attempt_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(39) NOT NULL,
    success BOOLEAN NOT NULL,
    user_agent VARCHAR(512),
    ram_gb FLOAT NULL,
    cpu_cores SMALLINT UNSIGNED NULL,
    gpu_info VARCHAR(128) NULL,
    device_os VARCHAR(64) NULL,
    page VARCHAR(64) NOT NULL,          
    http_method ENUM('GET', 'POST') NOT NULL,
    CONSTRAINT fk_login_attempts_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);


DELIMITER $$
CREATE TRIGGER trg_prevent_delete_login_attempts
BEFORE DELETE ON login_attempts
FOR EACH ROW
BEGIN
    DECLARE retention_days INT;
    DECLARE allowed_date TIMESTAMP;

    -- Get the retention value from the config table (id = 19)
    SELECT value INTO retention_days
    FROM config
    WHERE id = 19;

    -- Calculate the minimum date to allow deletion
    SET allowed_date = DATE_ADD(OLD.attempt_time, INTERVAL retention_days DAY);

    -- Block if the time has not passed yet
    IF NOW() < allowed_date THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot delete record before retention period expires.';
    END IF;
END$$

DELIMITER ;
DELIMITER $$
CREATE PROCEDURE reorganize_login_attempts_ids()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE old_id, new_id, max_id BIGINT UNSIGNED;
    DECLARE update_count INT DEFAULT 0;
    DECLARE id_cursor CURSOR FOR SELECT id FROM login_attempts ORDER BY id;
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
            SELECT COUNT(*) INTO @id_exists FROM login_attempts WHERE id = new_id;

            IF @id_exists = 0 THEN
                -- Update the ID
                UPDATE login_attempts SET id = new_id WHERE id = old_id;
                SET update_count = update_count + 1;
            END IF;
        END IF;

        SET new_id = new_id + 1;
    END LOOP;

    CLOSE id_cursor;

    -- Adjust AUTO_INCREMENT to next available ID
    SELECT IFNULL(MAX(id), 0) + 1 INTO max_id FROM login_attempts;
    SET @stmt = CONCAT('ALTER TABLE login_attempts AUTO_INCREMENT = ', max_id);
    PREPARE stmt FROM @stmt;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;

    COMMIT;
END$$
DELIMITER ;




CREATE TABLE sessions (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL UNIQUE,
    session_id VARCHAR(128) NOT NULL UNIQUE,
    user_agent VARCHAR(512),
    ram_gb FLOAT NULL,
    cpu_cores SMALLINT UNSIGNED NULL,
   
    gpu_info VARCHAR(128) NULL,
    device_os VARCHAR(64) NULL,
    summary CHAR(64) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE
);


DELIMITER $$
CREATE PROCEDURE reorganize_sessions_ids()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE old_id, new_id, max_id INT UNSIGNED;
    DECLARE update_count INT DEFAULT 0;
    DECLARE id_cursor CURSOR FOR SELECT id FROM sessions ORDER BY id;
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
            SELECT COUNT(*) INTO @id_exists FROM sessions WHERE id = new_id;

            IF @id_exists = 0 THEN
                -- Update the ID
                UPDATE sessions SET id = new_id WHERE id = old_id;
                SET update_count = update_count + 1;
            END IF;
        END IF;

        SET new_id = new_id + 1;
    END LOOP;

    CLOSE id_cursor;

    -- Adjust AUTO_INCREMENT to next available ID
    SELECT IFNULL(MAX(id), 0) + 1 INTO max_id FROM sessions;
    SET @stmt = CONCAT('ALTER TABLE sessions AUTO_INCREMENT = ', max_id);
    PREPARE stmt FROM @stmt;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;

    COMMIT;
END$$
DELIMITER ;