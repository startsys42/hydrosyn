USE hydrosyn_db;

CREATE TABLE notification_email_history (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL,
    lang_code ENUM('es', 'en') NOT NULL,
    changed_by INT UNSIGNED NOT NULL,
    changed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(39) NOT NULL,
    user_agent VARCHAR(512)  NULL,
    ram_gb FLOAT NULL,
    cpu_cores SMALLINT UNSIGNED NULL,
    cpu_architecture VARCHAR(32) NULL,
    gpu_info VARCHAR(128) NULL,
    device_os VARCHAR(64) NULL,

    
    FOREIGN KEY (changed_by) REFERENCES users(id) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE
) ENGINE=InnoDB;

DELIMITER $$

CREATE TRIGGER trg_prevent_duplicate_email_insert
BEFORE INSERT ON notification_email_history
FOR EACH ROW
BEGIN
    DECLARE last_email VARCHAR(100);

    SELECT email INTO last_email
    FROM notification_email_history
    ORDER BY changed_at DESC, id DESC
    LIMIT 1;

    IF last_email IS NOT NULL AND NEW.email = last_email THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'The email is the same as the most recently stored email.';
    END IF;
END$$

DELIMITER ;

DELIMITER $$
CREATE TRIGGER trg_notification_email_history_delete
BEFORE DELETE ON notification_email_history
FOR EACH ROW
BEGIN
 DECLARE latest_id INT UNSIGNED;
    SELECT id INTO latest_id
    FROM notification_email_history
    ORDER BY changed_at DESC, id DESC
    LIMIT 1;

    IF latest_id IS NOT NULL AND latest_id = OLD.id THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot delete the latest email change record for a user.';
    END IF;
END$$
DELIMITER ;

DELIMITER $$
CREATE TRIGGER trg_notification_email_history_retain
BEFORE DELETE ON notification_email_history
FOR EACH ROW
BEGIN
    DECLARE retention_days INT;
    DECLARE allowed_date TIMESTAMP;

   
    SELECT value INTO retention_days
    FROM config
    WHERE id = 20;

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
CREATE PROCEDURE reorganize_notification_email_history_ids()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE old_id, new_id, max_id INT UNSIGNED;
    DECLARE update_count INT DEFAULT 0;
    DECLARE id_cursor CURSOR FOR SELECT id FROM notification_email_history ORDER BY id;
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
            SELECT COUNT(*) INTO @id_exists FROM notification_email_history WHERE id = new_id;

            IF @id_exists = 0 THEN
                -- Update the ID
                UPDATE notification_email_history SET id = new_id WHERE id = old_id;
                SET update_count = update_count + 1;
            END IF;
        END IF;

        SET new_id = new_id + 1;
    END LOOP;

    CLOSE id_cursor;

    -- Adjust AUTO_INCREMENT to next available ID
    SELECT IFNULL(MAX(id), 0) + 1 INTO max_id FROM notification_email_history;
    SET @stmt = CONCAT('ALTER TABLE notification_email_history AUTO_INCREMENT = ', max_id);
    PREPARE stmt FROM @stmt;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;

    COMMIT;
END$$
DELIMITER ;




CREATE TABLE notification_should_send_email_history (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    notification_id INT UNSIGNED NOT NULL,
    changed_by INT UNSIGNED NOT NULL,
    changed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    should_send_email_old_value BOOLEAN NOT NULL,
    should_send_email_new_value BOOLEAN NOT NULL,
    ip_address VARCHAR(39) NOT NULL,
    user_agent VARCHAR(512) NULL,
    ram_gb FLOAT NULL,
    cpu_cores SMALLINT UNSIGNED NULL,
    cpu_architecture VARCHAR(32) NULL,
    gpu_info VARCHAR(128) NULL,
    device_os VARCHAR(64) NULL,


    
    FOREIGN KEY (notification_id) REFERENCES notifications(id) 
        ON DELETE RESTRICT
        ON UPDATE RESTRICT,
    FOREIGN KEY (changed_by) REFERENCES users(id) 
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
           CONSTRAINT chk_old_new_diff CHECK (should_send_email_old_value <> should_send_email_new_value)
) ENGINE=InnoDB;

DELIMITER $$

CREATE TRIGGER trg_prevent_latest_should_send_email_delete
BEFORE DELETE ON notification_should_send_email_history
FOR EACH ROW
BEGIN
    DECLARE latest_id INT UNSIGNED;

    -- Buscar el último registro solo para ese notification_id
    SELECT id INTO latest_id
    FROM notification_should_send_email_history
    WHERE notification_id = OLD.notification_id
    ORDER BY changed_at DESC, id DESC
    LIMIT 1;

    -- Si el registro que se va a borrar es el más reciente, bloquearlo
    IF latest_id = OLD.id THEN      
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot delete the latest should_send_email change record for this notification.';
    END IF;
END$$

DELIMITER ;



DELIMITER $$
CREATE TRIGGER trg_notification_should_send_email_history_retain
BEFORE DELETE ON notification_should_send_email_history
FOR EACH ROW
BEGIN
    DECLARE retention_days INT;
    DECLARE allowed_date TIMESTAMP;

    -- Get the retention period from config
    SELECT value INTO retention_days
    FROM config
    WHERE id = 21;

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
CREATE TRIGGER trg_notification_should_send_email_history_insert
BEFORE INSERT ON notification_should_send_email_history
FOR EACH ROW
BEGIN

    -- Check if the new record has different old and new values
    IF NEW.should_send_email_old_value = NEW.should_send_email_new_value THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Old and new values for should_send_email must be different.';
    END IF;
END$$   
DELIMITER ;

DELIMITER $$

CREATE TRIGGER trg_prevent_invalid_should_send_email_insert
BEFORE INSERT ON notification_should_send_email_history
FOR EACH ROW
BEGIN
    DECLARE last_new_value BOOLEAN;

    -- Buscar el último valor registrado para ese notification_id
    SELECT should_send_email_new_value INTO last_new_value
    FROM notification_should_send_email_history
    WHERE notification_id = NEW.notification_id
    ORDER BY changed_at DESC, id DESC
    LIMIT 1;

    -- Si existe un registro previo, y el nuevo old_value no encadena con el anterior new_value, lanzar error
    IF last_new_value IS NOT NULL AND NEW.should_send_email_old_value != last_new_value THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'The old value does not match the last recorded new value for this notification_id.';
    END IF;
END$$

DELIMITER ;



DELIMITER $$
CREATE PROCEDURE reorganize_notification_should_send_email_history_ids()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE old_id, new_id, max_id INT UNSIGNED;
    DECLARE update_count INT DEFAULT 0;
    DECLARE id_cursor CURSOR FOR SELECT id FROM notification_should_send_email_history ORDER BY id;
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
            SELECT COUNT(*) INTO @id_exists FROM notification_should_send_email_history WHERE id = new_id;

            IF @id_exists = 0 THEN
                -- Update the ID
                UPDATE notification_should_send_email_history SET id = new_id WHERE id = old_id;
                SET update_count = update_count + 1;
            END IF;
        END IF;

        SET new_id = new_id + 1;
    END LOOP;

    CLOSE id_cursor;

    -- Adjust AUTO_INCREMENT to next available ID
    SELECT IFNULL(MAX(id), 0) + 1 INTO max_id FROM notification_should_send_email_history;
    SET @stmt = CONCAT('ALTER TABLE notification_should_send_email_history AUTO_INCREMENT = ', max_id);
    PREPARE stmt FROM @stmt;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;

    COMMIT;
END$$
DELIMITER ;



CREATE TABLE notification_events (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    notification_id INT UNSIGNED NOT NULL,         -- Tipo de notificación
    user_id INT UNSIGNED NOT NULL,                 -- A qué usuario le afecta (target)
   
    lang_code ENUM('es', 'en') NOT NULL,
    formatted_message VARCHAR(255) NOT NULL,               -- Texto listo para mostrar
    extra_data JSON DEFAULT NULL,                  -- Información adicional (IP, intentos, etc.)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE,
    read_at DATETIME DEFAULT NULL,

    FOREIGN KEY (notification_id) REFERENCES notifications(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,

    FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE RESTRICT ON UPDATE CASCADE

    
);



DELIMITER $$
CREATE TRIGGER trg_prevent_delete_unread_notification_event
BEFORE DELETE ON notification_events
FOR EACH ROW
BEGIN
    IF OLD.is_read = FALSE THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot delete unread notification events.';
    END IF;
END$$
DELIMITER ;

DELIMITER $$
CREATE TRIGGER trg_prevent_delete_notification_event_before_time
BEFORE DELETE ON notification_events
FOR EACH ROW
BEGIN
    DECLARE retention_days INT;
    DECLARE allowed_date TIMESTAMP;

    -- Get the retention period from config
    SELECT value INTO retention_days
    FROM config
    WHERE id = 22;

    -- Calculate the minimum date to allow deletion
    SET allowed_date = DATE_ADD(OLD.created_at, INTERVAL retention_days DAY);

    -- Block if the time has not passed yet
    IF NOW() < allowed_date THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot delete notification event before retention period expires.';
    END IF;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE reorganize_notification_events_ids()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE old_id, new_id, max_id INT UNSIGNED;
    DECLARE update_count INT DEFAULT 0;
    DECLARE id_cursor CURSOR FOR SELECT id FROM notification_events ORDER BY id;
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
            SELECT COUNT(*) INTO @id_exists FROM notification_events WHERE id = new_id;

            IF @id_exists = 0 THEN
                -- Update the ID
                UPDATE notification_events SET id = new_id WHERE id = old_id;
                SET update_count = update_count + 1;
            END IF;
        END IF;

        SET new_id = new_id + 1;
    END LOOP;

    CLOSE id_cursor;

    -- Adjust AUTO_INCREMENT to next available ID
    SELECT IFNULL(MAX(id), 0) + 1 INTO max_id FROM notification_events;
    SET @stmt = CONCAT('ALTER TABLE notification_events AUTO_INCREMENT = ', max_id);
    PREPARE stmt FROM @stmt;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;

    COMMIT;
END$$
DELIMITER ;

