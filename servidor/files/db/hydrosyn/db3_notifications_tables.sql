CREATE DATABASE IF NOT EXISTS hydrosyn_db CHARACTER SET utf8mb4 COLLATE  utf8mb4_bin;
USE hydrosyn_db;

CREATE TABLE notifications (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

);


CREATE TABLE notification_translations (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    notification_id INT UNSIGNED NOT NULL,
    lang_code ENUM('es', 'en') NOT NULL,
    description VARCHAR(255) NOT NULL,

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

    FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    FOREIGN KEY (notification_id) REFERENCES notifications(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);
