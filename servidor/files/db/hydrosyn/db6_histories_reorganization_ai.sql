
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

CREATE TABLE user_email_changes (
    id INT PRIMARY KEY AUTO_INCREMENT NOT NULL,
    user_id INT UNSIGNED NOT NULL,
    old_email VARCHAR(255) NOT NULL,
    new_email VARCHAR(255) NOT NULL,
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
