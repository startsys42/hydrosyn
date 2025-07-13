CREATE DATABASE IF NOT EXISTS hydrosyn_db CHARACTER SET utf8mb4 COLLATE  utf8mb4_bin;
USE hydrosyn_db;

-- ENCENDIDO SEREVR ROBOD E COOKIES usuario lista engra intenta loguearse od esactivado
CREATE TABLE notifications (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
     should_send_email BOOLEAN NOT NULL DEFAULT FALSE,  -- Control por notificación
  
);
CREATE TABLE notification_email_history (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    changed_by INT UNSIGNED NOT NULL,
    changed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (changed_by) REFERENCES users(id) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE
) ENGINE=InnoDB;
CREATE TABLE notification_history (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    notification_id INT UNSIGNED NOT NULL,
    changed_by INT UNSIGNED NOT NULL,
    changed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    should_send_email_old_value BOOLEAN NOT NULL,
    
    FOREIGN KEY (notification_id) REFERENCES notifications(id) 
        ON DELETE RESTRICT
        ON UPDATE RESTRICT,
    FOREIGN KEY (changed_by) REFERENCES users(id) 
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB;


CREATE TABLE notification_translations (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    notification_id INT UNSIGNED NOT NULL,
    lang_code ENUM('es', 'en') NOT NULL,
    description VARCHAR(255) NOT NULL UNIQUE,
template_text VARCHAR(255) NOT NULL,
    FOREIGN KEY (notification_id) REFERENCES notifications(id)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT,

    UNIQUE (notification_id, lang_code)
);


CREATE TABLE user_notifications (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    notification_id INT UNSIGNED NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    read_at DATETIME DEFAULT NULL,
formatted_message VARCHAR(255) NOT NULL
    FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    FOREIGN KEY (notification_id) REFERENCES notifications(id)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT
);
