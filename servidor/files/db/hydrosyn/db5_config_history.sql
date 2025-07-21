USE hydrosyn_db;



CREATE TABLE IF NOT EXISTS config_history (
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    config_id INT UNSIGNED NOT NULL,
    old_value INT UNSIGNED NOT NULL,
    new_value INT UNSIGNED NOT NULL,
    changed_by INT UNSIGNED NOT NULL ,
    change_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ip_address VARCHAR(39) NOT NULL,
    user_agent VARCHAR(512) NOT NULL,
    ram_gb FLOAT NULL,
    cpu_cores SMALLINT UNSIGNED NULL,
    cpu_architecture VARCHAR(32) NULL,
    device_os VARCHAR(64) NULL,
    gpu_info VARCHAR(128) NULL,

  
    
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
    DECLARE last_new_value INT UNSIGNED;

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

    SELECT new_value INTO last_new_value
FROM config_history
WHERE config_id = NEW.config_id
ORDER BY change_timestamp DESC, id DESC
LIMIT 1;

-- If there is a previous record, validate old_value = last_new_value
IF last_new_value IS NOT NULL THEN
    IF NEW.old_value <> last_new_value THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = CONCAT('The old_value (', NEW.old_value, 
                                 ') must be equal to the last recorded new_value (', last_new_value, ') for config_id ', NEW.config_id);
    END IF;
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

CREATE TRIGGER trg_prevent_early_delete_config_history
BEFORE DELETE ON config_history
FOR EACH ROW
BEGIN
    DECLARE min_days INT;

    -- Get number of days from config table (config.id = 8)
    SELECT `value` INTO min_days
    FROM config
    WHERE id = 8;

    -- Prevent delete if not enough time has passed
    IF NOW() < DATE_ADD(OLD.change_timestamp, INTERVAL min_days DAY) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Deletion not allowed: minimum retention period has not passed in table config_history.';
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