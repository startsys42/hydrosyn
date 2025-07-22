USE hydrosyn_db;



CREATE TABLE  IF NOT EXISTS  users(
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT NOT NULL,
    username VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    first_login BOOLEAN NOT NULL DEFAULT FALSE,
    change_pass TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    delete_possible  BOOLEAN NOT NULL DEFAULT  FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by INT UNSIGNED NOT NULL,
    language ENUM('es', 'en') NOT NULL DEFAULT 'en',
    theme ENUM('dark', 'light') NOT NULL DEFAULT 'light',
    use_2fa BOOLEAN NOT NULL DEFAULT FALSE,
    fa_verified BOOLEAN NOT NULL DEFAULT FALSE,
    twofa_secret VARCHAR(32) UNIQUE,
    
     CONSTRAINT chk_username_alphanumeric CHECK (username REGEXP '^[a-zA-Z0-9]+$'),
     CONSTRAINT twofa_consistency CHECK (
        (use_2fa = FALSE AND twofa_secret IS NULL) OR
        (use_2fa = TRUE AND twofa_secret IS NOT NULL)
    ),
    CONSTRAINT fa_verified_consistency CHECK (
    fa_verified = FALSE OR 
    (fa_verified = TRUE AND use_2fa = TRUE AND twofa_secret IS NOT NULL)
),
    CONSTRAINT fk_user_creator
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
)ENGINE=InnoDB;



SET FOREIGN_KEY_CHECKS = 0;

-- Insertar usuario system con created_by temporal (0)
INSERT INTO users (
    username, email, password, is_active, first_login, delete_possible, created_by, language, theme, use_2fa, fa_verified, twofa_secret
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


CREATE TABLE IF NOT EXISTS delete_possible_users_history (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    old_value BOOLEAN NOT NULL,
    new_value BOOLEAN NOT NULL,
    changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    changed_by INT UNSIGNED NOT NULL,
    ip_address VARCHAR(39) NOT NULL,
    user_agent VARCHAR(512),
    ram_gb FLOAT NULL,
    cpu_cores SMALLINT UNSIGNED NULL,
    cpu_architecture VARCHAR(32) NULL,
    gpu_info VARCHAR(128) NULL,
    device_os VARCHAR(64) NULL,


    FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    FOREIGN KEY (changed_by) REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
        CONSTRAINT chk_old_new_diff CHECK (old_value <> new_value)
)ENGINE=InnoDB;

DELIMITER $$
CREATE TRIGGER trg_delete_possible_users_history_prevent_latest_deletion
BEFORE DELETE ON delete_possible_users_history
FOR EACH ROW
BEGIN
    DECLARE max_changed_at TIMESTAMP;
    DECLARE max_id INT UNSIGNED;

    SELECT changed_at, id INTO max_changed_at, max_id
    FROM delete_possible_users_history
    WHERE user_id = OLD.user_id
    ORDER BY changed_at DESC, id DESC
    LIMIT 1;

    IF max_id IS NOT NULL AND OLD.id = max_id THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot delete the most recent record for this user in delete_possible_users_history';
    END IF;
END$$
DELIMITER ;

DELIMITER $$

CREATE TRIGGER trg_check_consistency_on_insert
BEFORE INSERT ON delete_possible_users_history
FOR EACH ROW
BEGIN
    DECLARE last_value BOOLEAN;

    -- Obtener el último new_value registrado para ese usuario
    SELECT new_value INTO last_value
    FROM delete_possible_users_history
    WHERE user_id = NEW.user_id
    ORDER BY changed_at DESC, id DESC
    LIMIT 1;

    -- Comparar con el old_value que se intenta insertar
    IF last_value IS NOT NULL AND NEW.old_value != last_value THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Old value does not match the most recent value for this user.';
    END IF;

    -- Verificación redundante por si el CHECK falla
    IF NEW.old_value = NEW.new_value THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Old and new values must be different.';
    END IF;
END$$

DELIMITER ;

DELIMITER $$

CREATE TRIGGER trg_prevent_delete_before_possible_users_history
BEFORE DELETE ON delete_possible_users_history
FOR EACH ROW
BEGIN
    DECLARE retention_days INT;
    DECLARE allowed_date TIMESTAMP;

    -- Obtener el valor de retención de la tabla config (id = 9)
    SELECT value INTO retention_days
    FROM config
    WHERE id = 9;

    -- Calcular la fecha mínima para permitir borrar
    SET allowed_date = DATE_ADD(OLD.changed_at, INTERVAL retention_days DAY);

    -- Bloquear si aún no ha pasado el tiempo
    IF NOW() < allowed_date THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot delete record before retention period expires.';
    END IF;
END$$

DELIMITER ;



DELIMITER $$

CREATE PROCEDURE reorganize_delete_possible_users_history_ids()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE old_id, new_id, max_id INT UNSIGNED;
    DECLARE update_count INT DEFAULT 0;
    DECLARE id_cursor CURSOR FOR SELECT id FROM delete_possible_users_history ORDER BY id;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    -- Iniciar transacción
    START TRANSACTION;

    -- Inicializar contador
    SET new_id = 1;

    -- Abrir cursor
    OPEN id_cursor;

    read_loop: LOOP
        FETCH id_cursor INTO old_id;
        IF done THEN
            LEAVE read_loop;
        END IF;

        IF old_id != new_id THEN
            -- Verificar que no haya conflicto con el nuevo ID
            SET @id_exists = 0;
            SELECT COUNT(*) INTO @id_exists FROM delete_possible_users_history WHERE id = new_id;

            IF @id_exists = 0 THEN
                -- Actualizar el ID
                UPDATE delete_possible_users_history SET id = new_id WHERE id = old_id;
                SET update_count = update_count + 1;
            END IF;
        END IF;

        SET new_id = new_id + 1;
    END LOOP;

    CLOSE id_cursor;

    -- Ajustar AUTO_INCREMENT al siguiente valor disponible
    SELECT IFNULL(MAX(id), 0) + 1 INTO max_id FROM delete_possible_users_history;
    SET @stmt = CONCAT('ALTER TABLE delete_possible_users_history AUTO_INCREMENT = ', max_id);
    PREPARE stmt FROM @stmt;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;

    COMMIT;
END$$

DELIMITER ;





CREATE TABLE IF NOT EXISTS twofa_activation_history (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    old_value BOOLEAN NOT NULL,
    new_value BOOLEAN NOT NULL,
    changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    changed_by INT UNSIGNED NOT NULL,
ip_address VARCHAR(39) NOT NULL,
    user_agent VARCHAR(512),
    ram_gb FLOAT NULL,
    cpu_cores SMALLINT UNSIGNED NULL,
    cpu_architecture VARCHAR(32) NULL,
    gpu_info VARCHAR(128) NULL,
    device_os VARCHAR(64) NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    FOREIGN KEY (changed_by) REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
          CONSTRAINT chk_old_new_diff CHECK (old_value <> new_value)
)ENGINE=InnoDB;

DELIMITER $$

CREATE TRIGGER trg_twofa_activation_history_before_insert
BEFORE INSERT ON twofa_activation_history
FOR EACH ROW
BEGIN
    DECLARE last_new_value BOOLEAN;

    -- Ensure old and new values are different
    IF NEW.old_value = NEW.new_value THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Old and new values must be different in twofa_activation_history';
    END IF;

    -- Fetch the last recorded new_value for this user
    SELECT new_value INTO last_new_value
    FROM twofa_activation_history
    WHERE user_id = NEW.user_id
    ORDER BY changed_at DESC, id DESC
    LIMIT 1;

    -- If a previous record exists, ensure consistency with old_value
    IF last_new_value IS NOT NULL AND NEW.old_value <> last_new_value THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Old value does not match the last recorded state for this user in twofa_activation_history';
    END IF;
END$$


CREATE TRIGGER trg_twofa_activation_history_prevent_latest_deletion
BEFORE DELETE ON twofa_activation_history
FOR EACH ROW
BEGIN
    DECLARE max_changed_at TIMESTAMP;
    DECLARE max_id INT UNSIGNED;

    SELECT changed_at, id INTO max_changed_at, max_id
    FROM twofa_activation_history
    WHERE user_id = OLD.user_id
    ORDER BY changed_at DESC, id DESC
    LIMIT 1;

    IF max_id IS NOT NULL AND OLD.id = max_id THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot delete the most recent record for this user in twofa_activation_history';
    END IF;
END$$

DELIMITER ;


DELIMITER $$

CREATE TRIGGER trg_prevent_delete_before_twofa_activation_history
BEFORE DELETE ON twofa_activation_history
FOR EACH ROW
BEGIN
    DECLARE retention_days INT;
    DECLARE allowed_date TIMESTAMP;

    -- Obtener el valor de retención de la tabla config (id = 10)
    SELECT value INTO retention_days
    FROM config
    WHERE id = 10;

    -- Calcular la fecha mínima para permitir borrar
    SET allowed_date = DATE_ADD(OLD.changed_at, INTERVAL retention_days DAY);

    -- Bloquear si aún no ha pasado el tiempo
    IF NOW() < allowed_date THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot delete record before retention period expires.';
    END IF;
END$$

DELIMITER ;



DELIMITER $$

CREATE PROCEDURE reorganize_twofa_activation_history_ids()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE old_id, new_id, max_id INT UNSIGNED;
    DECLARE update_count INT DEFAULT 0;
    DECLARE id_cursor CURSOR FOR SELECT id FROM twofa_activation_history ORDER BY id;
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
            SELECT COUNT(*) INTO @id_exists FROM twofa_activation_history WHERE id = new_id;

            IF @id_exists = 0 THEN
                -- Update the ID
                UPDATE twofa_activation_history SET id = new_id WHERE id = old_id;
                SET update_count = update_count + 1;
            END IF;
        END IF;

        SET new_id = new_id + 1;
    END LOOP;

    CLOSE id_cursor;

    -- Adjust AUTO_INCREMENT to next available ID
    SELECT IFNULL(MAX(id), 0) + 1 INTO max_id FROM twofa_activation_history;
    SET @stmt = CONCAT('ALTER TABLE twofa_activation_history AUTO_INCREMENT = ', max_id);
    PREPARE stmt FROM @stmt;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;

    COMMIT;
END$$

DELIMITER ;


CREATE TABLE IF NOT EXISTS user_activation_history (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    prev_is_active BOOLEAN NOT NULL,
    new_is_active BOOLEAN NOT NULL,
    changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    changed_by INT UNSIGNED NOT NULL, -- ID de quien hizo el cambio
    ip_address VARCHAR(39) NOT NULL,
    user_agent VARCHAR(512),    
    ram_gb FLOAT NULL,
    cpu_cores SMALLINT UNSIGNED NULL,
    cpu_architecture VARCHAR(32) NULL,
    gpu_info VARCHAR(128) NULL,
    device_os VARCHAR(64) NULL,

    FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    FOREIGN KEY (changed_by) REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT chk_prev_new_diff CHECK (prev_is_active <> new_is_active)
) ENGINE=InnoDB;
DELIMITER $$
CREATE TRIGGER trg_user_activation_history_before_insert
BEFORE INSERT ON user_activation_history
FOR EACH ROW
BEGIN
    DECLARE last_new_value BOOLEAN;

    -- Ensure prev_is_active and new_is_active are different
    IF NEW.prev_is_active = NEW.new_is_active THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Previous and new active states must be different in user_activation_history';
    END IF;

    -- Fetch the last recorded new_is_active for this user
    SELECT new_is_active INTO last_new_value
    FROM user_activation_history
    WHERE user_id = NEW.user_id
    ORDER BY changed_at DESC, id DESC
    LIMIT 1;

    -- If a previous record exists, ensure consistency with prev_is_active
    IF last_new_value IS NOT NULL AND NEW.prev_is_active <> last_new_value THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Previous active state does not match the last recorded state for this user in user_activation_history';
    END IF;
END$$

CREATE TRIGGER trg_user_activation_history_prevent_latest_deletion
BEFORE DELETE ON user_activation_history
FOR EACH ROW
BEGIN
    -- Prevent deletion of the latest record for a user
    DECLARE latest_id INT UNSIGNED;
    SELECT id INTO latest_id
    FROM user_activation_history
    WHERE user_id = OLD.user_id
    ORDER BY changed_at DESC, id DESC
    LIMIT 1;

    IF latest_id IS NOT NULL AND latest_id = OLD.id THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot delete the latest activation history record for a user.';
    END IF;
END$$

DELIMITER ;

DELIMITER $$
CREATE TRIGGER trg_prevent_delete_before_user_activation_history
BEFORE DELETE ON user_activation_history
FOR EACH ROW
BEGIN
    DECLARE retention_days INT;
    DECLARE allowed_date TIMESTAMP;

    -- Get the retention value from the config table (id = 8)
    SELECT value INTO retention_days
    FROM config
    WHERE id = 11;

    -- Calculate the minimum date to allow deletion
    SET allowed_date = DATE_ADD(OLD.changed_at, INTERVAL retention_days DAY);

    -- Block if the time has not passed yet
    IF NOW() < allowed_date THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot delete record before retention period expires.';
    END IF;
END$$

DELIMITER ;

DELIMITER $$
CREATE PROCEDURE reorganize_user_activation_history_ids()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE old_id, new_id, max_id INT UNSIGNED;
    DECLARE update_count INT DEFAULT 0;
    DECLARE id_cursor CURSOR FOR SELECT id FROM user_activation_history ORDER BY id;
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
            SELECT COUNT(*) INTO @id_exists FROM user_activation_history WHERE id = new_id;

            IF @id_exists = 0 THEN
                -- Update the ID
                UPDATE user_activation_history SET id = new_id WHERE id = old_id;
                SET update_count = update_count + 1;
            END IF;
        END IF;

        SET new_id = new_id + 1;
    END LOOP;

    CLOSE id_cursor;

    -- Adjust AUTO_INCREMENT to next available ID
    SELECT IFNULL(MAX(id), 0) + 1 INTO max_id FROM user_activation_history;
    SET @stmt = CONCAT('ALTER TABLE user_activation_history AUTO_INCREMENT = ', max_id);
    PREPARE stmt FROM @stmt;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;

    COMMIT;
END$$
DELIMITER ;

CREATE TABLE IF NOT EXISTS email_verification_history (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    email VARCHAR(100) NOT NULL,
    token VARCHAR(6) NOT NULL,
    requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP NULL,
    ip_address VARCHAR(39) NOT NULL,
    user_agent VARCHAR(512),
    ram_gb FLOAT NULL,
    cpu_cores SMALLINT UNSIGNED NULL,
    cpu_architecture VARCHAR(32) NULL,
    gpu_info VARCHAR(128) NULL,
    device_os VARCHAR(64) NULL,

    CONSTRAINT chk_requested_before_verified CHECK (requested_at < verified_at OR verified_at IS NULL),

    FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB;

DELIMITER $$
CREATE TRIGGER trg_block_delete_email_verification_history
BEFORE DELETE ON email_verification_history
FOR EACH ROW
BEGIN
    DECLARE retention_days INT;
    DECLARE allowed_date TIMESTAMP;

    -- Get the retention value from the config table (id = 12)
    SELECT value INTO retention_days
    FROM config
    WHERE id = 12;

    -- Calculate the minimum date to allow deletion
    SET allowed_date = DATE_ADD(OLD.requested_at, INTERVAL retention_days DAY);

    -- Block if the time has not passed yet
    IF NOW() < allowed_date THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot delete record before retention period expires.';
    END IF;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE reorganize_email_verification_history_ids()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE old_id, new_id, max_id INT UNSIGNED;
    DECLARE update_count INT DEFAULT 0;
    DECLARE id_cursor CURSOR FOR SELECT id FROM email_verification_history ORDER BY id;
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
            SELECT COUNT(*) INTO @id_exists FROM email_verification_history WHERE id = new_id;

            IF @id_exists = 0 THEN
                -- Update the ID
                UPDATE email_verification_history SET id = new_id WHERE id = old_id;
                SET update_count = update_count + 1;
            END IF;
        END IF;

        SET new_id = new_id + 1;
    END LOOP;

    CLOSE id_cursor;

    -- Adjust AUTO_INCREMENT to next available ID
    SELECT IFNULL(MAX(id), 0) + 1 INTO max_id FROM email_verification_history;
    SET @stmt = CONCAT('ALTER TABLE email_verification_history AUTO_INCREMENT = ', max_id);
    PREPARE stmt FROM @stmt;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;

    COMMIT;
END$$
DELIMITER ;



CREATE TABLE username_policy_current (
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    
    min_length INT NOT NULL DEFAULT 6,
    max_length INT NOT NULL DEFAULT 20,
    
    min_lowercase INT NOT NULL DEFAULT 0,
    min_numbers INT NOT NULL DEFAULT 0,
    min_uppercase INT NOT NULL DEFAULT 0,
    
    min_distinct_chars INT NOT NULL DEFAULT 3,
    min_distinct_digits INT NOT NULL DEFAULT 0,
    
    applied_since TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    changed_by INT UNSIGNED NOT NULL,
  
    
    CONSTRAINT fk_username_policy_current_changed_by 
        FOREIGN KEY (changed_by) REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    
    -- Constraints actualizadas según tu pedido:
    CONSTRAINT chk_min_length_min CHECK (min_length >= 6),
    CONSTRAINT chk_max_length_max CHECK (max_length <= 20),
    CONSTRAINT chk_max_length_min_length CHECK (max_length >= min_length),
    
    CONSTRAINT chk_sum_min_chars_max_length CHECK (
        (min_numbers + min_lowercase + min_uppercase) <= max_length
    ),
    
    CONSTRAINT chk_sum_min_chars_min_length CHECK (
        (min_numbers + min_lowercase + min_uppercase) >= min_length
    ),
    
    CONSTRAINT chk_min_distinct_chars CHECK (
        min_distinct_chars <= (min_lowercase + min_uppercase)
    ),
    
    CONSTRAINT chk_min_distinct_digits CHECK (
        min_distinct_digits <= min_numbers
    )
);


CREATE TABLE username_policy_history (
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    
    min_length INT NOT NULL DEFAULT 6,
    max_length INT NOT NULL DEFAULT 20,
    
    min_lowercase INT NOT NULL DEFAULT 0,
    min_numbers INT NOT NULL DEFAULT 0,
    min_uppercase INT NOT NULL DEFAULT 0,
    
    min_distinct_chars INT NOT NULL DEFAULT 3,
    min_distinct_digits INT NOT NULL DEFAULT 0,
    
    applied_since TIMESTAMP NOT NULL,
    
    changed_by INT UNSIGNED NOT NULL,
      ip_address VARCHAR(39) NOT NULL,
    user_agent VARCHAR(512),
    ram_gb FLOAT NULL,
    cpu_cores SMALLINT UNSIGNED NULL,
    cpu_architecture VARCHAR(32) NULL,
    gpu_info VARCHAR(128) NULL,
    device_os VARCHAR(64) NULL,
    
    CONSTRAINT fk_username_policy_history_changed_by 
        FOREIGN KEY (changed_by) REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    
    -- Constraints actualizadas:
    CONSTRAINT chk_min_length_min_hist CHECK (min_length >= 6),
    CONSTRAINT chk_max_length_max_hist CHECK (max_length <= 20),
    CONSTRAINT chk_max_length_min_length_hist CHECK (max_length >= min_length),
    
    CONSTRAINT chk_sum_min_chars_max_length_hist CHECK (
        (min_numbers + min_lowercase + min_uppercase) <= max_length
    ),
    
    CONSTRAINT chk_sum_min_chars_min_length_hist CHECK (
        (min_numbers + min_lowercase + min_uppercase) >= min_length
    ),
    
    CONSTRAINT chk_min_distinct_chars_hist CHECK (
        min_distinct_chars <= (min_lowercase + min_uppercase)
    ),
    
    CONSTRAINT chk_min_distinct_digits_hist CHECK (
        min_distinct_digits <= min_numbers
    )
);

DELIMITER $$
CREATE PROCEDURE reorganize_username_policy_history_ids()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE old_id, new_id, max_id INT UNSIGNED;
    DECLARE update_count INT DEFAULT 0;
    DECLARE id_cursor CURSOR FOR SELECT id FROM username_policy_history ORDER BY id;
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
            SELECT COUNT(*) INTO @id_exists FROM username_policy_history WHERE id = new_id;

            IF @id_exists = 0 THEN
                -- Update the ID
                UPDATE username_policy_history SET id = new_id WHERE id = old_id;
                SET update_count = update_count + 1;
            END IF;
        END IF;

        SET new_id = new_id + 1;
    END LOOP;

    CLOSE id_cursor;

    -- Adjust AUTO_INCREMENT to next available ID
    SELECT IFNULL(MAX(id), 0) + 1 INTO max_id FROM username_policy_history;
    SET @stmt = CONCAT('ALTER TABLE username_policy_history AUTO_INCREMENT = ', max_id);
    PREPARE stmt FROM @stmt;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;

    COMMIT;
END$$
DELIMITER ;


DELIMITER $$
CREATE TRIGGER trg_prevent_delete_username_policy_history
BEFORE DELETE ON username_policy_history
FOR EACH ROW
BEGIN
    DECLARE retention_days INT;
    DECLARE allowed_date TIMESTAMP;

    -- Get the retention value from the config table (id = 13)
    SELECT value INTO retention_days
    FROM config
    WHERE id = 13;

    -- Calculate the minimum date to allow deletion
    SET allowed_date = DATE_ADD(OLD.applied_since, INTERVAL retention_days DAY);

    -- Block if the time has not passed yet
    IF NOW() < allowed_date THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot delete record before retention period expires.';
    END IF;
END$$
DELIMITER ;



CREATE TABLE password_policy_current (
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    min_length INT NOT NULL DEFAULT 12,
    min_numbers INT NOT NULL DEFAULT 2,
    min_uppercase INT NOT NULL DEFAULT 1,
    min_special_chars INT NOT NULL DEFAULT 1,
    min_lowercase INT NOT NULL DEFAULT 1,
    min_distinct_chars INT NOT NULL DEFAULT 8,
    min_distinct_digits INT NOT NULL DEFAULT 0,
    max_password_age_days INT NOT NULL DEFAULT 90,
    min_password_history INT NOT NULL DEFAULT 5,
    min_password_age_history_days INT NOT NULL DEFAULT 450, -- nuevo campo
allow_username_in_password BOOLEAN NOT NULL DEFAULT FALSE,
    changed_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    changed_by INT UNSIGNED NOT NULL,

    CONSTRAINT fk_current_changed_by FOREIGN KEY (changed_by) REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    
    -- min_length >= suma de los requisitos mínimos
    CONSTRAINT chk_min_length_components CHECK (
        min_length >= (min_numbers + min_uppercase + min_special_chars + min_lowercase)
    ),
CONSTRAINT chk_min_length_at_least_8 CHECK (
        min_length >= 8
    ),
    -- min_distinct_chars <= min_uppercase + min_lowercase
    CONSTRAINT chk_distinct_chars_vs_cases CHECK (
        min_distinct_chars <= (min_uppercase + min_lowercase)
    ),

    -- min_distinct_digits <= min_numbers
    CONSTRAINT chk_distinct_digits_vs_numbers CHECK (
        min_distinct_digits <= min_numbers
    ),

    -- min_password_age_history_days >= max_password_age_days * min_password_history
    CONSTRAINT chk_min_age_history CHECK (
      min_password_age_history_days >= (max_password_age_days * min_password_history)
    )
) ENGINE=InnoDB;




CREATE TABLE password_policy_history (
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    min_length INT NOT NULL DEFAULT 12,
    min_numbers INT NOT NULL DEFAULT 2,
    min_uppercase INT NOT NULL DEFAULT 1,
    min_special_chars INT NOT NULL DEFAULT 1,
    min_lowercase INT NOT NULL DEFAULT 1,
    min_distinct_chars INT NOT NULL DEFAULT 8,
    min_distinct_digits INT NOT NULL DEFAULT 0,
    max_password_age_days INT NOT NULL DEFAULT 90,
    min_password_history INT NOT NULL DEFAULT 5,
    min_password_age_history_days INT NOT NULL DEFAULT 450, -- mínimo días entre cambios
allow_username_in_password BOOLEAN NOT NULL DEFAULT FALSE,
    changed_by INT UNSIGNED NOT NULL, -- ID del usuario que hizo el cambio
    changed_at TIMESTAMP NOT NULL,
    ip_address VARCHAR(39) NOT NULL,
    user_agent VARCHAR(512),
    ram_gb FLOAT NULL,
    cpu_cores SMALLINT UNSIGNED NULL,
    cpu_architecture VARCHAR(32) NULL,
    gpu_info VARCHAR(128) NULL,
    device_os VARCHAR(64) NULL,

    CONSTRAINT fk_changed_by FOREIGN KEY (changed_by) REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

      -- min_length >= suma de los requisitos mínimos
    CONSTRAINT chk_min_length_components CHECK (
        min_length >= (min_numbers + min_uppercase + min_special_chars + min_lowercase)
    ),

    -- min_distinct_chars <= min_uppercase + min_lowercase
    CONSTRAINT chk_distinct_chars_vs_cases CHECK (
        min_distinct_chars <= (min_uppercase + min_lowercase)
    ),

    -- min_distinct_digits <= min_numbers
    CONSTRAINT chk_distinct_digits_vs_numbers CHECK (
        min_distinct_digits <= min_numbers
    ),
CONSTRAINT chk_min_length_at_least_8 CHECK (
        min_length >= 8
    ),
    -- min_password_age_history_days >= max_password_age_days * min_password_history
    CONSTRAINT chk_min_age_history CHECK (
      min_password_age_history_days >= (max_password_age_days * min_password_history)
    )
);

DELIMITER $$
CREATE PROCEDURE reorganize_password_policy_history_ids()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE old_id, new_id, max_id INT UNSIGNED;
    DECLARE update_count INT DEFAULT 0;
    DECLARE id_cursor CURSOR FOR SELECT id FROM password_policy_history ORDER BY id;
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
            SELECT COUNT(*) INTO @id_exists FROM password_policy_history WHERE id = new_id;

            IF @id_exists = 0 THEN
                -- Update the ID
                UPDATE password_policy_history SET id = new_id WHERE id = old_id;
                SET update_count = update_count + 1;
            END IF;
        END IF;

        SET new_id = new_id + 1;
    END LOOP;

    CLOSE id_cursor;

    -- Adjust AUTO_INCREMENT to next available ID
    SELECT IFNULL(MAX(id), 0) + 1 INTO max_id FROM password_policy_history;
    SET @stmt = CONCAT('ALTER TABLE password_policy_history AUTO_INCREMENT = ', max_id);
    PREPARE stmt FROM @stmt;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
    COMMIT;
END$$
DELIMITER ;

DELIMITER $$
CREATE TRIGGER trg_prevent_delete_password_policy_history
BEFORE DELETE ON password_policy_history
FOR EACH ROW
BEGIN
    DECLARE retention_days INT;
    DECLARE allowed_date TIMESTAMP;

    -- Get the retention value from the config table (id = 14)
    SELECT value INTO retention_days
    FROM config
    WHERE id = 14;

    -- Calculate the minimum date to allow deletion
    SET allowed_date = DATE_ADD(OLD.changed_at, INTERVAL retention_days DAY);

    -- Block if the time has not passed yet
    IF NOW() < allowed_date THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot delete record before retention period expires.';
    END IF;
END$$
DELIMITER ;

CREATE TABLE IF NOT EXISTS password_special_chars (
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    special_char VARCHAR(1) NOT NULL UNIQUE,
    added_by INT UNSIGNED,  -- Usuario que añadió el nombre
    added_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (added_by) REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    -- Regla: el carácter no debe ser una letra ni número
    CONSTRAINT chk_special_char_valid CHECK (
        special_char NOT REGEXP '^[A-Za-z0-9]$'
    )
) ENGINE=InnoDB;




CREATE TABLE IF NOT EXISTS password_special_chars_history (
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    special_char VARCHAR(1) NOT NULL ,
    added_by INT UNSIGNED,  -- Usuario que añadió el nombre
        deleted_by INT UNSIGNED,
      add_at TIMESTAMP NOT NULL,
   deleted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
   ip_address VARCHAR(39) NOT NULL,
   user_agent VARCHAR(512),
   ram_gb FLOAT NULL,
   cpu_cores SMALLINT UNSIGNED NULL,
   cpu_architecture VARCHAR(32) NULL,
   gpu_info VARCHAR(128) NULL,
   device_os VARCHAR(64) NULL,

    FOREIGN KEY (added_by) REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
   FOREIGN KEY (deleted_by) REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    
    -- Regla: el carácter no debe ser una letra ni número
    CONSTRAINT chk_special_char_valid CHECK (
        special_char NOT REGEXP '^[A-Za-z0-9]$'
    )
) ENGINE=InnoDB;

DELIMITER $$
CREATE TRIGGER trg_prevent_delete_password_special_chars_history
BEFORE DELETE ON password_special_chars_history
FOR EACH ROW
BEGIN
    DECLARE retention_days INT;
    DECLARE allowed_date TIMESTAMP;

    -- Get the retention value from the config table (id = 15)
    SELECT value INTO retention_days
    FROM config
    WHERE id = 15;

    -- Calculate the minimum date to allow deletion
    SET allowed_date = DATE_ADD(OLD.add_at, INTERVAL retention_days DAY);

    -- Block if the time has not passed yet
    IF NOW() < allowed_date THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot delete record before retention period expires.';
    END IF;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE reorganize_password_special_chars_history_ids()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE old_id, new_id, max_id INT UNSIGNED;
    DECLARE update_count INT DEFAULT 0;
    DECLARE id_cursor CURSOR FOR SELECT id FROM password_special_chars_history ORDER BY id;
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
            SELECT COUNT(*) INTO @id_exists FROM password_special_chars_history WHERE id = new_id;

            IF @id_exists = 0 THEN
                -- Update the ID
                UPDATE password_special_chars_history SET id = new_id WHERE id = old_id;
                SET update_count = update_count + 1;
            END IF;
        END IF;

        SET new_id = new_id + 1;
    END LOOP;

    CLOSE id_cursor;

    -- Adjust AUTO_INCREMENT to next available ID
    SELECT IFNULL(MAX(id), 0) + 1 INTO max_id FROM password_special_chars_history;
    SET @stmt = CONCAT('ALTER TABLE password_special_chars_history AUTO_INCREMENT = ', max_id);
    PREPARE stmt FROM @stmt;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;

    COMMIT;
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
('system'),
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





CREATE TABLE IF NOT EXISTS username_blacklist_history (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(20) NOT NULL,
    
    add_at TIMESTAMP NOT NULL,
      deleted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    add_by INT UNSIGNED NOT NULL,     -- Usuario que realizó el cambio (puede ser NULL si fue automático)
    deleted_by INT UNSIGNED not NULL,     -- Usuario que eliminó el nombre (si aplica)
    ip_address VARCHAR(39) NOT NULL,
    user_agent VARCHAR(512),
    ram_gb FLOAT NULL,
    cpu_cores SMALLINT UNSIGNED NULL,   
    cpu_architecture VARCHAR(32) NULL,
    gpu_info VARCHAR(128) NULL,
    device_os VARCHAR(64) NULL,

    FOREIGN KEY (add_by) REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    FOREIGN KEY (deleted_by) REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB;

DELIMITER $$
CREATE TRIGGER trg_prevent_delete_username_blacklist_history
BEFORE DELETE ON username_blacklist_history
FOR EACH ROW
BEGIN
    DECLARE retention_days INT;
    DECLARE allowed_date TIMESTAMP;

    -- Get the retention value from the config table (id = 16)
    SELECT value INTO retention_days
    FROM config
    WHERE id = 16;

    -- Calculate the minimum date to allow deletion
    SET allowed_date = DATE_ADD(OLD.add_at, INTERVAL retention_days DAY);

    -- Block if the time has not passed yet
    IF NOW() < allowed_date THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot delete record before retention period expires.';
    END IF;
END$$

DELIMITER ;

DELIMITER $$
CREATE PROCEDURE reorganize_username_blacklist_history_ids()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE old_id, new_id, max_id INT UNSIGNED;
    DECLARE update_count INT DEFAULT 0;
    DECLARE id_cursor CURSOR FOR SELECT id FROM username_blacklist_history ORDER BY id;
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
            SELECT COUNT(*) INTO @id_exists FROM username_blacklist_history WHERE id = new_id;

            IF @id_exists = 0 THEN
                -- Update the ID
                UPDATE username_blacklist_history SET id = new_id WHERE id = old_id;
                SET update_count = update_count + 1;
            END IF;
        END IF;

        SET new_id = new_id + 1;
    END LOOP;

    CLOSE id_cursor;

    -- Adjust AUTO_INCREMENT to next available ID
    SELECT IFNULL(MAX(id), 0) + 1 INTO max_id FROM username_blacklist_history;
    SET @stmt = CONCAT('ALTER TABLE username_blacklist_history AUTO_INCREMENT = ', max_id);
    PREPARE stmt FROM @stmt;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;

    COMMIT;
END$$
DELIMITER ;




CREATE TABLE user_password_history (
    id INT PRIMARY KEY AUTO_INCREMENT NOT NULL,
    user_id INT UNSIGNED NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    changed_by INT UNSIGNED NOT NULL,
    ip_address VARCHAR(39) NOT NULL,
    user_agent VARCHAR(512) NOT NULL,
    ram_gb FLOAT NULL,
    cpu_cores SMALLINT UNSIGNED NULL,
    cpu_architecture VARCHAR(32) NULL,
    gpu_info VARCHAR(128) NULL,
    device_os VARCHAR(64) NULL,

    CONSTRAINT fk_password_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_password_changed_by
        FOREIGN KEY (changed_by) REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

DELIMITER $$
CREATE TRIGGER trg_user_password_history_validate_new_password
BEFORE INSERT ON user_password_history
FOR EACH ROW
BEGIN
    DECLARE last_password_hash VARCHAR(255);
    -- Get the most recent password hash for the user
    SELECT password_hash INTO last_password_hash
    FROM user_password_history
    WHERE user_id = NEW.user_id
    ORDER BY created_at DESC
    LIMIT 1;

    -- Compare the new password hash with the last one
    IF last_password_hash = NEW.password_hash THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'The new password hash must be different from the last recorded password hash for this user.';
    END IF;
END$$
DELIMITER ;

DELIMITER $$

CREATE TRIGGER trg_prevent_recent_password_deletion
BEFORE DELETE ON user_password_history
FOR EACH ROW
BEGIN
    DECLARE min_history INT;
    DECLARE min_age_days INT;
    DECLARE recent_password_cutoff TIMESTAMP;
    DECLARE password_rank INT;

    -- Obtener la política actual (suponiendo que solo hay un registro en password_policy_current)
    SELECT 
        min_password_history,
        min_password_age_history_days
    INTO 
        min_history,
        min_age_days
    FROM password_policy_current
    LIMIT 1;

    -- Calcular la fecha límite para antigüedad mínima
    SET recent_password_cutoff = NOW() - INTERVAL min_age_days DAY;

    -- Verificar si la contraseña está dentro del rango mínimo de antigüedad
    IF OLD.created_at > recent_password_cutoff THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot delete a password that is too recent based on password policy (age restriction).';
    END IF;

    -- Contar cuántas contraseñas tiene el usuario más recientes que la actual
    SELECT COUNT(*) + 1 INTO password_rank
    FROM user_password_history
    WHERE user_id = OLD.user_id AND created_at > OLD.created_at;

    -- Verificar si la contraseña se encuentra dentro de las N más recientes
    IF password_rank <= min_history THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot delete one of the most recent passwords based on password history policy.';
    END IF;

END$$

DELIMITER ;




DELIMITER $$

CREATE PROCEDURE reorganize_user_password_history_ids()
BEGIN      
    DECLARE done INT DEFAULT FALSE;
    DECLARE old_id, new_id, max_id INT UNSIGNED;
    DECLARE update_count INT DEFAULT 0;
    DECLARE id_cursor CURSOR FOR SELECT id FROM user_password_history ORDER BY id;
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
            SELECT COUNT(*) INTO @id_exists FROM user_password_history WHERE id = new_id;

            IF @id_exists = 0 THEN
                -- Update the ID
                UPDATE user_password_history SET id = new_id WHERE id = old_id;
                SET update_count = update_count + 1;
            END IF;
        END IF;

        SET new_id = new_id + 1;
    END LOOP;

    CLOSE id_cursor;

    -- Adjust AUTO_INCREMENT to next available ID
    SELECT IFNULL(MAX(id), 0) + 1 INTO max_id FROM user_password_history;
    SET @stmt = CONCAT('ALTER TABLE user_password_history AUTO_INCREMENT = ', max_id);
    PREPARE stmt FROM @stmt;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;

    COMMIT;
END$$
DELIMITER ;


CREATE TABLE user_email_changes (
    id INT PRIMARY KEY AUTO_INCREMENT NOT NULL,
    user_id INT UNSIGNED NOT NULL,
    old_email VARCHAR(100) NOT NULL,
    new_email VARCHAR(100) NOT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    changed_by INT UNSIGNED NOT NULL,
    ip_address VARCHAR(39),
    user_agent VARCHAR(512),
    ram_gb FLOAT NULL,
    cpu_cores SMALLINT UNSIGNED NULL,
    cpu_architecture VARCHAR(32) NULL,
    gpu_info VARCHAR(128) NULL,
    device_os VARCHAR(64) NULL,

  CONSTRAINT chk_emails_different CHECK (old_email <> new_email),
    CONSTRAINT fk_email_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_email_changed_by
        FOREIGN KEY (changed_by) REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

DELIMITER $$

CREATE TRIGGER trg_user_email_changes_old_vs_new
BEFORE INSERT ON user_email_changes
FOR EACH ROW
BEGIN
    -- Ensure that old_email and new_email are not the same
    IF NEW.old_email = NEW.new_email THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Old and new email addresses cannot be the same.';
    END IF;
END$$

DELIMITER ;

DELIMITER $$
CREATE TRIGGER trg_user_email_changes_prevent_latest_deletion
BEFORE DELETE ON user_email_changes
FOR EACH ROW
BEGIN
    -- Prevent deletion of the latest email change record for a user
    DECLARE latest_id INT UNSIGNED;
    SELECT id INTO latest_id
    FROM user_email_changes
    WHERE user_id = OLD.user_id
    ORDER BY changed_at DESC, id DESC
    LIMIT 1;

    IF latest_id = OLD.id THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot delete the latest email change record for a user.';
    END IF;
END$$
DELIMITER ;


DELIMITER $$

CREATE TRIGGER trg_validate_user_email_changes_chain
BEFORE INSERT ON user_email_changes
FOR EACH ROW
BEGIN
    DECLARE last_email VARCHAR(100);

    -- Obtener el último new_email del historial del usuario
    SELECT new_email INTO last_email
    FROM user_email_changes
    WHERE user_id = NEW.user_id
    ORDER BY changed_at DESC, id DESC
    LIMIT 1;

    -- Si existe un cambio previo y no coincide con el old_email del nuevo, bloquear
    IF last_email IS NOT NULL AND NEW.old_email != last_email THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'El campo old_email debe coincidir con el último new_email registrado para este usuario.';
    END IF;
END$$

DELIMITER ;
DELIMITER $$
CREATE PROCEDURE reorganize_user_email_changes_ids()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE old_id, new_id, max_id INT UNSIGNED;
    DECLARE update_count INT DEFAULT 0;
    DECLARE id_cursor CURSOR FOR SELECT id FROM user_email_changes ORDER BY id;
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
            SELECT COUNT(*) INTO @id_exists FROM user_email_changes WHERE id = new_id;

            IF @id_exists = 0 THEN
                -- Update the ID
                UPDATE user_email_changes SET id = new_id WHERE id = old_id;
                SET update_count = update_count + 1;
            END IF;
        END IF;

        SET new_id = new_id + 1;
    END LOOP;

    CLOSE id_cursor;

    -- Adjust AUTO_INCREMENT to next available ID
    SELECT IFNULL(MAX(id), 0) + 1 INTO max_id FROM user_email_changes;
    SET @stmt = CONCAT('ALTER TABLE user_email_changes AUTO_INCREMENT = ', max_id);
    PREPARE stmt FROM @stmt;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;

    COMMIT;
END$$
DELIMITER ;




CREATE TABLE IF NOT EXISTS username_history (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,          -- usuario cuyo nombre cambió
    old_username VARCHAR(20) NOT NULL,     -- nombre anterior
    new_username VARCHAR(20) NOT NULL,     -- nuevo nombre
    changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    changed_by INT UNSIGNED NOT NULL,
    ip_address VARCHAR(39) NOT NULL,   
    user_agent VARCHAR(512) NOT NULL,
    ram_gb FLOAT NULL,
    cpu_cores SMALLINT UNSIGNED NULL,
    cpu_architecture VARCHAR(32) NULL,
    gpu_info VARCHAR(128) NULL,
    device_os VARCHAR(64) NULL,
    CONSTRAINT chk_new_username_alphanumeric CHECK (new_username REGEXP '^[a-zA-Z0-9]+$'),
    CONSTRAINT chk_old_username_alphanumeric CHECK (old_username REGEXP '^[a-zA-Z0-9]+$'),

    CONSTRAINT fk_unh_user FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_unh_changed_by FOREIGN KEY (changed_by) REFERENCES users(id)
        ON DELETE RESTRICT ON UPDATE CASCADE
);
DELIMITER $$
CREATE TRIGGER trg_username_history_before_insert
BEFORE INSERT ON username_history
FOR EACH ROW
BEGIN
    -- Validate new username
    IF NEW.new_username = '' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'New username cannot be empty.';
    END IF;

    -- Check for username changes
    IF NEW.old_username = NEW.new_username THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'New username must be different from the old username.';
    END IF;
END$$

DELIMITER ;
DELIMITER $$
CREATE TRIGGER trg_username_history_prevent_latest_deletion
BEFORE DELETE ON username_history
FOR EACH ROW
BEGIN
    -- Prevent deletion of the latest username change
    IF OLD.changed_at = (SELECT MAX(changed_at) FROM username_history WHERE user_id = OLD.user_id) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot delete the latest username change.';
    END IF;
END$$

CREATE TRIGGER trg_prevent_delete_before_retention_username_history
BEFORE DELETE ON username_history
FOR EACH ROW
BEGIN
    DECLARE retention_days INT;
    DECLARE allowed_date TIMESTAMP;

    -- Get the retention value from the config table (id = 18)
    SELECT value INTO retention_days
    FROM config
    WHERE id = 18;

    -- Calculate the minimum date to allow deletion
    SET allowed_date = DATE_ADD(OLD.changed_at, INTERVAL retention_days DAY);

    -- Block if the time has not passed yet
    IF NOW() < allowed_date THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot delete record before retention period expires.';
    END IF;
END$$

CREATE TRIGGER trg_validate_username_history
BEFORE INSERT ON username_history
FOR EACH ROW
BEGIN
    IF (SELECT new_username FROM username_history WHERE user_id = NEW.user_id ORDER BY changed_at DESC LIMIT 1) != NEW.old_username THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'New username must be different from the last username.';
    END IF;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE reorganize_username_history_ids()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE old_id, new_id, max_id INT UNSIGNED;
    DECLARE update_count INT DEFAULT 0;
    DECLARE id_cursor CURSOR FOR SELECT id FROM username_history ORDER BY id;
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
            SELECT COUNT(*) INTO @id_exists FROM username_history WHERE id = new_id;

            IF @id_exists = 0 THEN
                -- Update the ID
                UPDATE username_history SET id = new_id WHERE id = old_id;
                SET update_count = update_count + 1;
            END IF;
        END IF;

        SET new_id = new_id + 1;
    END LOOP;

    CLOSE id_cursor;

    -- Adjust AUTO_INCREMENT to next available ID
    SELECT IFNULL(MAX(id), 0) + 1 INTO max_id FROM username_history;
    SET @stmt = CONCAT('ALTER TABLE username_history AUTO_INCREMENT = ', max_id);
    PREPARE stmt FROM @stmt;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;

    COMMIT;
END$$
DELIMITER ;


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
    cpu_architecture VARCHAR(32) NULL,
    gpu_info VARCHAR(128) NULL,
    device_os VARCHAR(64) NULL,
    recovery BOOLEAN NOT NULL,
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
    cpu_architecture VARCHAR(32) NULL,
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