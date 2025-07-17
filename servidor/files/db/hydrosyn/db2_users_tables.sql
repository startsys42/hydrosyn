
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
    twofa_secret VARCHAR(32) UNIQUE,
     CONSTRAINT chk_username_alphanumeric CHECK (username REGEXP '^[a-zA-Z0-9]+$'),
     CONSTRAINT twofa_consistency CHECK (
        (use_2fa = FALSE AND twofa_secret IS NULL) OR
        (use_2fa = TRUE AND twofa_secret IS NOT NULL)
    )
    CONSTRAINT fk_user_creator
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
)ENGINE=InnoDB;





CREATE TABLE IF NOT EXISTS username_blacklist (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(20) NOT NULL UNIQUE,
    added_by INT UNSIGNED,  -- Usuario que añadió el nombre
    added_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (added_by) REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB;



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






CREATE TABLE login_attempts (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNSIGNED NULL,
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
    expires_at TIMESTAMP NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE
);


CREATE TABLE tokens (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNSIGNED NOT NULL,
    token VARCHAR(512) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    revoked_at TIMESTAMP,
    revoked_reason VARCHAR(255),
    revoked_by INT UNSIGNED,  -- quién revocó la sesión
    revoked_device VARCHAR(255),
    revoked_ip VARCHAR(39),
    revoked_user_agent TEXT,
    ip_addresses JSON,  -- guarda todas las IPs usadas en sesión
    user_agent TEXT,
    device VARCHAR(255),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (revoked_by) REFERENCES users(id) ON DELETE SET NULL
);




