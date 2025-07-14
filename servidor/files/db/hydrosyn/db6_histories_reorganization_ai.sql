
USE hydrosyn_db;

-- CEAR TRIGER VALORES NO BOOL VIEJOS Y NEUIVOS
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



DELIMITER //

CREATE PROCEDURE reorganize_config_history_ids()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE old_id, new_id, max_id INT;
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
    
    
  
END//

DELIMITER ;

CREATE TABLE IF NOT EXISTS delete_possible_history (
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

CREATE TABLE IF NOT EXISTS email_verification_history (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(8),
    requested_at TIMESTAMP NOT NULL,
    verified_at TIMESTAMP NULL,
    was_successful BOOLEAN NOT NULL DEFAULT FALSE,
    request_ip VARCHAR(45) NULL,     -- opcional: IP desde donde se solicitó
    user_agent TEXT NULL,            -- opcional: info del navegador/cliente

    FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB;

