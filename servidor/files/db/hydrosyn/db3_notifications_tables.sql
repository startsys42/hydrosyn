CREATE TABLE notifications (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2️⃣ Traducciones por idioma
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

-- 3️⃣ Relación usuario - notificación
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
