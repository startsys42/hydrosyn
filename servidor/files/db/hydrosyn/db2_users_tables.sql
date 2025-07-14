
USE hydrosyn_db;



CREATE TABLE  IF NOT EXISTS  users(
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT NOT NULL,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    change_pass TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    delete_possible  BOOLEAN NOT NULL DEFAULT  FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by INT UNSIGNED NOT NULL,
    language ENUM('es', 'en') NOT NULL DEFAULT 'en',
    theme ENUM('dark', 'light') NOT NULL DEFAULT 'light',
    use_2fa BOOLEAN NOT NULL DEFAULT FALSE,
    twofa_secret VARCHAR(32) UNIQUE,

    CONSTRAINT fk_user_creator
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
)ENGINE=InnoDB;


CREATE TABLE IF NOT EXISTS email_verifications (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(8) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    verified_at TIMESTAMP NULL,
    is_used BOOLEAN NOT NULL DEFAULT FALSE,

    FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB;





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
        ON UPDATE CASCADE
);




CREATE TABLE password_special_chars (
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    special_char VARCHAR(1) NOT NULL UNIQUE

);




CREATE TABLE username_blacklist (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(20) NOT NULL UNIQUE
 

);

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
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
);


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



