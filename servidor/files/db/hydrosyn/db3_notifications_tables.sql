CREATE DATABASE IF NOT EXISTS hydrosyn_db CHARACTER SET utf8mb4 COLLATE  utf8mb4_bin;
USE hydrosyn_db;


CREATE TABLE notifications (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
     should_send_email BOOLEAN NOT NULL DEFAULT FALSE,  -- Control por notificación
  
);
CREATE TABLE notification_email_history (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    lang_code ENUM('es', 'en') NOT NULL,
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
    subject VARCHAR(50) NOT NULL,
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
    
formatted_message VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    FOREIGN KEY (notification_id) REFERENCES notifications(id)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT
);


INSERT INTO notifications (should_send_email) VALUES (FALSE);
INSERT INTO notification_translations (notification_id, lang_code, description, subject, template_text) VALUES
(1, 'es', 'Arranque de servidor hydrosyn', 'Servidor Hydrosyn iniciado', 'El servidor Hydrosyn se ha iniciado correctamente a {fecha}'),
(1, 'en', 'Hydrosyn server startup', 'Hydrosyn Server Started', 'Hydrosyn server has started successfully on {date}');

-- 2. Posible robo de cookies
INSERT INTO notifications (should_send_email) VALUES (FALSE);
INSERT INTO notification_translations (notification_id, lang_code, description, subject, template_text) VALUES
(2, 'es', 'Posible robo de cookies', 'Alerta de seguridad', 'Se detectó un posible robo de cookies para el usuario {usuario} desde la IP {ip}'),
(2, 'en', 'Possible cookie theft', 'Security Alert', 'Possible cookie theft detected for user {user} from IP {ip}');

INSERT INTO notifications (id, should_send_email) 
VALUES (3, FALSE);

-- 2. Insertamos las traducciones con el formato que incluye al usuario
INSERT INTO notification_translations (notification_id, lang_code, description, subject, template_text) 
VALUES
(3, 'es', 'Cambio de email de notificaciones', 'Email de notificaciones cambiado', 'El usuario {usuario} cambió el email de notificaciones de {email_anterior} a {nuevo_email}'),
(3, 'en', 'Notification email change', 'Notification Email Changed', 'User {user} changed notification email from {old_email} to {new_email}');
-- Insertamos la notificación base (si no existe)
INSERT INTO notifications (id, should_send_email) VALUES (4, FALSE);

-- Traducciones (bien hecho, solo añadimos {user} y {notification_type} si quieres)
INSERT INTO notification_translations (notification_id, lang_code, description, subject, template_text) VALUES
(4, 'es', 'Activado/desactivado envío de notificación por email', 'Configuración de notificaciones', 'El usuario {user} cambió la notificación "{notification_type}" a {estado}'),
(4, 'en', 'Email notification toggle', 'Notification Settings', 'User {user} set "{notification_type}" notifications to {status}');

-- 5. Intento de login con nombre de lista negra
INSERT INTO notifications (should_send_email) VALUES (FALSE);
INSERT INTO notification_translations (notification_id, lang_code, description, subject, template_text) VALUES
(5, 'es', 'Intento de login con nombre de lista negra', 'Intento de acceso bloqueado', 'El usuario {usuario} (en lista negra) intentó acceder desde la IP {ip}'),
(5, 'en', 'Blacklist login attempt', 'Blocked Login Attempt', 'Blacklisted user {user} tried to login from IP {ip}');

-- 6. Intento de recuperacion con nombre de lista negra
INSERT INTO notifications (should_send_email) VALUES (FALSE);
INSERT INTO notification_translations (notification_id, lang_code, description, subject, template_text) VALUES
(6, 'es', 'Intento de recuperacion con nombre de lista negra', 'Intento de recuperación bloqueado', 'El usuario {usuario} (en lista negra) intentó recuperar contraseña desde la IP {ip}'),
(6, 'en', 'Blacklist recovery attempt', 'Blocked Recovery Attempt', 'Blacklisted user {user} tried password recovery from IP {ip}');

-- 7. Intento de login con usuario no activo
INSERT INTO notifications (should_send_email) VALUES (FALSE);
INSERT INTO notification_translations (notification_id, lang_code, description, subject, template_text) VALUES
(7, 'es', 'Intento de login con usuario no activo', 'Intento de acceso inactivo', 'El usuario inactivo {usuario} intentó acceder desde la IP {ip}'),
(7, 'en', 'Inactive user login attempt', 'Inactive Login Attempt', 'Inactive user {user} tried to login from IP {ip}');

-- 8. Intento de recuperacion de contraseña con usuario no activo
INSERT INTO notifications (should_send_email) VALUES (FALSE);
INSERT INTO notification_translations (notification_id, lang_code, description, subject, template_text) VALUES
(8, 'es', 'Intento de recuperacion con usuario no activo', 'Intento de recuperación inactivo', 'El usuario inactivo {usuario} intentó recuperar contraseña desde la IP {ip}'),
(8, 'en', 'Inactive user recovery attempt', 'Inactive Recovery Attempt', 'Inactive user {user} tried password recovery from IP {ip}');
