CREATE DATABASE IF NOT EXISTS hydrosyn_db CHARACTER SET utf8mb4 COLLATE  utf8mb4_bin;
USE hydrosyn_db;

CREATE TABLE permissions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,  
    description VARCHAR(150) NOT NULL                    
);



CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT NOT NULL,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    was_actived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by INT NOT NULL,
    CONSTRAINT fk_user_creator
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

CREATE TABLE user_permissions (
    user_id INT NOT NULL,
    permission_id INT NOT NULL,
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, permission_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);


CREATE TABLE systems (
    id INT PRIMARY KEY AUTO_INCREMENT NOT NULL,
    system_name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deactivated_at TIMESTAMP DEFAULT NULL,
    created_by INT NOT NULL,
    deactivated_by INT DEFAULT NULL,

    CONSTRAINT fk_system_creator
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_system_deactivator
        FOREIGN KEY (deactivated_by)
        REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);


CREATE TABLE containers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    system_id INT NOT NULL,
    capacity DECIMAL(10,2) NOT NULL,
    crop VARCHAR(150) NOT NULL,
    added_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deactivated_at TIMESTAMP DEFAULT NULL,
    added_by INT NOT NULL,
    deactivated_by INT DEFAULT NULL,

    CONSTRAINT fk_container_system
        FOREIGN KEY (system_id)
        REFERENCES systems(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_container_creator
        FOREIGN KEY (added_by)
        REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_container_deactivator
        FOREIGN KEY (deactivated_by)
        REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);


CREATE TABLE system_users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    system_id INT NOT NULL,
    user_id INT NOT NULL,
    added_by INT NOT NULL,
    removed_by INT DEFAULT NULL,
    date_added TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    date_removed TIMESTAMP DEFAULT NULL,

    CONSTRAINT fk_su_system
        FOREIGN KEY (system_id)
        REFERENCES sistemas(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_su_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_su_added_by
        FOREIGN KEY (added_by)
        REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_su_removed_by
        FOREIGN KEY (removed_by)
        REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);
CREATE TABLE user_password_history (
    id INT PRIMARY KEY AUTO_INCREMENT NOT NULL,
    user_id INT NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    changed_by INT NOT NULL,
    device VARCHAR(255),
    ip_address VARCHAR(15),
    mac_address VARCHAR(17),

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
    user_id INT NOT NULL,
    old_email VARCHAR(255) NOT NULL,
    new_email VARCHAR(255) NOT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    changed_by INT NOT NULL,
    device VARCHAR(255),
    ip_address VARCHAR(15),
    mac_address VARCHAR(17),

    CONSTRAINT fk_email_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_email_changed_by
        FOREIGN KEY (changed_by) REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

CREATE TABLE user_sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    token VARCHAR(512) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    revoked_at TIMESTAMP,
    revoked_reason VARCHAR(255),
    revoked_by INT,  -- quién revocó la sesión
    revoked_device VARCHAR(255),
    revoked_ip VARCHAR(39),
    revoked_user_agent TEXT,
    ip_addresses JSON,  -- guarda todas las IPs usadas en sesión
    user_agent TEXT,
    device VARCHAR(255),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (revoked_by) REFERENCES users(id) ON DELETE SET NULL
);
