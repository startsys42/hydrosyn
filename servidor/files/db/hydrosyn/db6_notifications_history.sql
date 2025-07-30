USE hydrosyn_db;



CREATE TABLE notification_events (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    notification_id INT UNSIGNED NOT NULL,         -- Tipo de notificación
    user_id INT UNSIGNED NOT NULL,                 -- A qué usuario le afecta (target)
   
    lang_code ENUM('es', 'en') NOT NULL,
    formatted_message VARCHAR(255) NOT NULL,               -- Texto listo para mostrar
  
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE,
    read_at DATETIME DEFAULT NULL,
CHECK ((is_read = TRUE AND read_at IS NOT NULL) OR (is_read = FALSE AND read_at IS NULL)),
CHECK (read_at IS NULL OR read_at >= created_at), -- read_at debe ser NULL o posterior a created_at
    FOREIGN KEY (notification_id) REFERENCES notifications(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,

    FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE RESTRICT ON UPDATE CASCADE

    
);

DELIMITER $$

CREATE TRIGGER trg_notification_events_before_insert
BEFORE INSERT ON notification_events
FOR EACH ROW
BEGIN
    -- On insert, is_read must be FALSE and read_at must be NULL
    IF NEW.is_read <> FALSE THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'On insert, is_read must be FALSE';
    END IF;

    IF NEW.read_at IS NOT NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'On insert, read_at must be NULL';
    END IF;
END$$

CREATE TRIGGER trg_notification_events_before_update
BEFORE UPDATE ON notification_events
FOR EACH ROW
BEGIN
    -- Validate is_read and read_at relationship on update
    IF (NEW.is_read = TRUE AND NEW.read_at IS NULL) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'read_at cannot be NULL when is_read is TRUE';
    END IF;

    IF (NEW.is_read = FALSE AND NEW.read_at IS NOT NULL) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'read_at must be NULL when is_read is FALSE';
    END IF;

    -- Validate that read_at is NULL or >= created_at
    IF (NEW.read_at IS NOT NULL AND NEW.read_at < NEW.created_at) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'read_at must be NULL or later than created_at';
    END IF;
END$$

DELIMITER ;


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

