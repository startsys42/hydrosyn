
USE hydrosyn_db;
-- en cofig si debria dejar el ultimor egistro quizas pro qeuin loc ambio, 
-- CEAR TRIGER VALORES NO BOOL VIEJOS Y NEUIVOS
-- me faltan los triggers que impiden borrar histiris abtes de arametrsod econfig
--ips...
CREATE TABLE IF NOT EXISTS config_history (
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    config_id INT UNSIGNED NOT NULL,
    old_value INT UNSIGNED NOT NULL,
    new_value INT UNSIGNED NOT NULL,
    changed_by INT UNSIGNED NOT NULL ,
    change_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
    
    FOREIGN KEY (config_id) REFERENCES config(id)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT,
    
    FOREIGN KEY (changed_by) REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB;

DELIMITER $$

CREATE TRIGGER trg_config_history_validate_value_ranges
BEFORE INSERT ON config_history
FOR EACH ROW
BEGIN
    DECLARE config_min_value INT UNSIGNED ;
    DECLARE config_max_value INT UNSIGNED ;

    -- Get min and max allowed values from config table
    SELECT min_value, max_value INTO config_min_value, config_max_value 
    FROM config 
    WHERE id = NEW.config_id;

    -- Validate old_value is within allowed range
   IF NEW.old_value < config_min_value OR NEW.old_value > config_max_value THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = CONCAT('Config history old_value is outside allowed range (min: ', 
                                 config_min_value, ', max: ', config_max_value, ')');
    END IF;

    -- Validate new_value is within allowed range
    IF NEW.new_value < config_min_value OR NEW.new_value > config_max_value THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = CONCAT('Config history new_value is outside allowed range (min: ', 
                                 config_min_value, ', max: ', config_max_value, ')');
    END IF;
END$$



CREATE TRIGGER trg_config_history_prevent_latest_record_deletion
BEFORE DELETE ON config_history
FOR EACH ROW
BEGIN
    DECLARE latest_history_id INT UNSIGNED ;

    -- Get the most recent record ID for this config_id
    SELECT MAX(id) INTO latest_history_id 
    FROM config_history 
    WHERE config_id = OLD.config_id;

    -- Prevent deletion if this is the most recent record
IF OLD.id = latest_history_id THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = CONCAT('Cannot delete the most recent configuration history record for config_id: ', 
                                OLD.config_id);
    END IF;
END$$

DELIMITER ;

DELIMITER $$
CREATE PROCEDURE reorganize_config_history_ids()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE old_id, new_id, max_id INT UNSIGNED ;
    DECLARE update_count INT DEFAULT 0;
    DECLARE id_cursor CURSOR FOR SELECT id FROM config_history ORDER BY id;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    -- Start transaction for safety
    START TRANSACTION;
    
    -- Temporarily disable foreign key checks
 
    
    -- Initialize counter
    SET new_id = 1;
    
    -- Open cursor to scan through existing IDs
    OPEN id_cursor;
    
    id_loop: LOOP
        FETCH id_cursor INTO old_id;
        IF done THEN
            LEAVE id_loop;
        END IF;
        
        -- Only update if current ID doesn't match the desired sequence
        IF old_id != new_id THEN
            -- Check if target ID is available
            SET @id_exists = 0;
            SELECT COUNT(*) INTO @id_exists FROM config_history WHERE id = new_id;
            
            IF @id_exists = 0 THEN
                -- Perform the direct ID update
                UPDATE config_history SET id = new_id WHERE id = old_id;
                SET update_count = update_count + 1;
        
            END IF;
        END IF;
        
        SET new_id = new_id + 1;
    END LOOP;
    
    CLOSE id_cursor;
    COMMIT;
    -- Reset auto-increment value
     SELECT IFNULL(MAX(id), 0) + 1 INTO max_id FROM config_history;
    SET @stmt = CONCAT('ALTER TABLE config_history AUTO_INCREMENT = ', max_id);
    PREPARE stmt FROM @stmt;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
    

    
    -- Commit all changes
    
    
  
END$$

DELIMITER ;

CREATE TABLE IF NOT EXISTS delete_possible_users_history (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    old_value BOOLEAN NOT NULL,
    new_value BOOLEAN NOT NULL,
    changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    changed_by INT UNSIGNED NOT NULL,

    FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    FOREIGN KEY (changed_by) REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
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

CREATE TRIGGER trg_user_activation_history_validate_transition
BEFORE INSERT ON user_activation_history
FOR EACH ROW
BEGIN
    -- Declare variables first (MySQL requirement)
    DECLARE last_active_status BOOLEAN;
    
    -- Validate that status is actually changing
    IF NEW.prev_is_active = NEW.new_is_active THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Status transition must change the activation state (old and new values cannot be identical)';
    END IF;

    -- Get the last known status for this user
    SELECT new_is_active INTO last_active_status
    FROM user_activation_history
    WHERE user_id = NEW.user_id
    ORDER BY changed_at DESC, id DESC
    LIMIT 1;

    -- Validate the transition follows the history (if history exists)
    IF last_active_status IS NOT NULL AND NEW.prev_is_active <> last_active_status THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Previous status must match the last recorded status for this user';
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

    FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    FOREIGN KEY (changed_by) REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
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
    reason VARCHAR(255),              -- opcional, motivo del cambio

    FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    FOREIGN KEY (changed_by) REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB;

DELIMITER $$
CREATE TRIGGER trg_user_activation_history_before_insert
BEFORE INSERT ON user_activation_history
FOR EACH ROW
BEGIN
    DECLARE last_active_status BOOLEAN;

    -- Ensure prev_is_active and new_is_active are different
    IF NEW.prev_is_active = NEW.new_is_active THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Previous and new activation status cannot be the same';
    END IF;

    -- Fetch the last recorded activation status for this user
    SELECT new_is_active INTO last_active_status
    FROM user_activation_history
    WHERE user_id = NEW.user_id
    ORDER BY changed_at DESC, id DESC
    LIMIT 1;

    -- If a previous record exists, ensure consistency with prev_is_active
    IF last_active_status IS NOT NULL AND NEW.prev_is_active <> last_active_status THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Previous activation status does not match the last recorded state for this user';
    END IF;
END$$
CREATE TRIGGER trg_user_activation_history_prevent_latest_deletion
BEFORE DELETE ON user_activation_history
FOR EACH ROW
BEGIN
    DECLARE max_changed_at TIMESTAMP;
    DECLARE max_id INT UNSIGNED;

    SELECT changed_at, id INTO max_changed_at, max_id
    FROM user_activation_history
    WHERE user_id = OLD.user_id
    ORDER BY changed_at DESC, id DESC
    LIMIT 1;

    IF max_id IS NOT NULL AND OLD.id = max_id THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot delete the most recent record for this user in user_activation_history';
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
    token VARCHAR(8),
    requested_at TIMESTAMP NOT NULL,
    verified_at TIMESTAMP NULL,
    was_successful BOOLEAN NOT NULL DEFAULT FALSE,
    request_ip VARCHAR(45) NULL,     -- opcional: IP desde donde se solicitó
    user_agent TEXT NULL,            -- opcional: info del navegador/cliente


    CONSTRAINT chk_requested_before_verified CHECK (requested_at < verified_at OR verified_at IS NULL),

    FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB;

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

deLIMITER $$
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

CREATE TABLE IF NOT EXISTS username_blacklist_history (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(20) NOT NULL,
    
    add_at TIMESTAMP NOT NULL,
      deleted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    add_by INT UNSIGNED,     -- Usuario que realizó el cambio (puede ser NULL si fue automático)
    deleted_by INT UNSIGNED,     -- Usuario que eliminó el nombre (si aplica)

    FOREIGN KEY (add_by) REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    FOREIGN KEY (deleted_by) REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB;

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



CREATE TABLE IF NOT EXISTS password_special_chars_history (
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    special_char VARCHAR(1) NOT NULL ,
    added_by INT UNSIGNED,  -- Usuario que añadió el nombre
        deleted_by INT UNSIGNED,
      add_at TIMESTAMP NOT NULL,
   deleted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

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

-- falat completar ergistrosc ond atso d eip... en apssword history poern  triger en abse a tabald e config  y en email changes igual y comprobar valor viejo disinto al neuvo

CREATE TABLE user_password_history (
    id INT PRIMARY KEY AUTO_INCREMENT NOT NULL,
    user_id INT UNSIGNED NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    changed_by INT UNSIGNED NOT NULL,
    device VARCHAR(255),
    ip_address VARCHAR(39),
  

    CONSTRAINT fk_password_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_password_changed_by
        FOREIGN KEY (changed_by) REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);
 
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
END;


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
    device VARCHAR(255),
    ip_address VARCHAR(39),


    CONSTRAINT fk_email_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_email_changed_by
        FOREIGN KEY (changed_by) REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);


CREATE TRIGGER trg_user_email_changes_validate_new_email
BEFORE INSERT ON user_email_changes
FOR EACH ROW
BEGIN
    DECLARE last_email VARCHAR(100);
    -- Get the most recent email for the user
    SELECT new_email INTO last_email
    FROM user_email_changes
    WHERE user_id = NEW.user_id
    ORDER BY changed_at DESC
    LIMIT 1;

    -- Compare the new email with the last one
    IF last_email = NEW.new_email THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'The new email must be different from the last recorded email for this user.';
    END IF;
END;

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
    changed_by INT UNSIGNED NOT NULL,       -- usuario que hizo el cambio
    CONSTRAINT chk_new_username_alphanumeric CHECK (new_username REGEXP '^[a-zA-Z0-9]+$'),
    CONSTRAINT chk_old_username_alphanumeric CHECK (old_username REGEXP '^[a-zA-Z0-9]+$'),

    CONSTRAINT fk_unh_user FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_unh_changed_by FOREIGN KEY (changed_by) REFERENCES users(id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

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
END;

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

DELIMITER //

CREATE EVENT weekly_maintenance_auto
ON SCHEDULE
    EVERY 1 DAY
    STARTS CONCAT(CURRENT_DATE + INTERVAL 1 DAY, ' 02:00:00')
DO
BEGIN
    -- Basic error handling (will stop on first error)
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        -- Fail silently (or add notification logic here)
    END;
    
    -- Execute maintenance procedures in order
    CALL reorganize_config_history_ids();
    CALL reorganize_delete_possible_users_history_ids();
    CALL reorganize_twofa_activation_history_ids();
    CALL reorganize_user_activation_history_ids();
    CALL reorganize_email_verification_history_ids();
    CALL reorganize_password_policy_history_ids();
    CALL reorganize_password_special_chars_history_ids();
    CALL reorganize_username_policy_history_ids();
    CALL reorganize_username_blacklist_history_ids();
    CALL reorganize_user_password_history_ids();
    CALL reorganize_user_email_changes_ids();
    CALL reorganize_username_history_ids();


END //

DELIMITER ;
