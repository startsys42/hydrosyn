USE hydrosyn_db;

CREATE TABLE IF NOT EXISTS email_notifications (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NULL,
    language ENUM('es', 'en') NOT NULL DEFAULT 'en',
     code_2fa VARCHAR(6) NULL,
   
    CONSTRAINT chk_code_2fa_format 
        CHECK (code_2fa IS NULL OR code_2fa REGEXP '^[0-9a-zA-Z]{6}$'),
    CONSTRAINT single_row CHECK (id = 1) 
    
);

CREATE TABLE IF NOT EXISTS notifications (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    should_send_email BOOLEAN NOT NULL DEFAULT FALSE
   
    
);

DELIMITER //
CREATE TRIGGER check_email_before_insert
BEFORE INSERT ON notifications
FOR EACH ROW
BEGIN
    IF NEW.should_send_email = TRUE THEN
        IF NOT EXISTS (SELECT 1 FROM email_notifications WHERE email IS NOT NULL AND LENGTH(TRIM(email)) > 3) THEN
            SIGNAL SQLSTATE '45000' 
            SET MESSAGE_TEXT = 'Email must be configured in email_notifications table when should_send_email is set to TRUE';
        END IF;
    END IF;
END//
DELIMITER ;

DELIMITER //
CREATE TRIGGER check_email_before_update
BEFORE UPDATE ON notifications
FOR EACH ROW
BEGIN
    IF NEW.should_send_email = TRUE AND OLD.should_send_email = FALSE THEN
        IF NOT EXISTS (SELECT 1 FROM email_notifications WHERE email IS NOT NULL AND LENGTH(TRIM(email)) > 3) THEN
            SIGNAL SQLSTATE '45000' 
            SET MESSAGE_TEXT = 'Email must be configured in email_notifications table when enabling should_send_email';
        END IF;
    END IF;
END//
DELIMITER ;



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



INSERT INTO notifications (should_send_email) VALUES (FALSE);
INSERT INTO notification_translations (notification_id, lang_code, description, subject, template_text) VALUES
(1, 'es', 'Arranque de servidor hydrosyn', 'Servidor Hydrosyn iniciado', 'El servidor Hydrosyn se ha iniciado correctamente'),
(1, 'en', 'Hydrosyn server startup', 'Hydrosyn Server Started', 'Hydrosyn server has started successfully');

-- 2. Posible robo de cookies
INSERT INTO notifications (should_send_email) VALUES (FALSE);
INSERT INTO notification_translations (notification_id, lang_code, description, subject, template_text) VALUES
(2, 'es', 'Posible robo de cookies', 'Alerta de seguridad', 'Se detectó un posible robo de cookies para el usuario {user} desde la IP {ip}'),
(2, 'en', 'Possible cookie theft', 'Security Alert', 'Possible cookie theft detected for user {user} from IP {ip}');

INSERT INTO notifications (id, should_send_email) 
VALUES (3, FALSE);

-- 2. Insertamos las traducciones con el formato que incluye al usuario
INSERT INTO notification_translations (notification_id, lang_code, description, subject, template_text) 
VALUES
(3, 'es', 'Cambio de email de notificaciones', 'Email de notificaciones cambiado', 'El usuario {user} cambió el email de notificaciones de {old_email} a {new_email}'),
(3, 'en', 'Notification email change', 'Notification Email Changed', 'User {user} changed notification email from {old_email} to {new_email}');
-- Insertamos la notificación base (si no existe)
INSERT INTO notifications (id, should_send_email) VALUES (4, FALSE);

-- Traducciones (bien hecho, solo añadimos {user} y {notification_type} si quieres)
INSERT INTO notification_translations (notification_id, lang_code, description, subject, template_text) VALUES
(4, 'es', 'Activado/desactivado envío de notificación por email', 'Configuración de notificaciones', 'El usuario {user} cambió la notificación "{notification_type}" a {status}'),
(4, 'en', 'Email notification toggle', 'Notification Settings', 'User {user} set "{notification_type}" notifications to {status}');

-- 5. Intento de login con nombre de lista negra
INSERT INTO notifications (should_send_email) VALUES (FALSE);
INSERT INTO notification_translations (notification_id, lang_code, description, subject, template_text) VALUES
(5, 'es', 'Intento de login con nombre de lista negra', 'Intento de acceso bloqueado', 'El usuario {user} (en lista negra) intentó acceder desde la IP {ip}'),
(5, 'en', 'Blacklist login attempt', 'Blocked Login Attempt', 'Blacklisted user {user} tried to login from IP {ip}');

-- 6. Intento de recuperacion con nombre de lista negra
INSERT INTO notifications (should_send_email) VALUES (FALSE);
INSERT INTO notification_translations (notification_id, lang_code, description, subject, template_text) VALUES
(6, 'es', 'Intento de recuperacion con nombre de lista negra', 'Intento de recuperación bloqueado', 'El usuario {user} (en lista negra) intentó recuperar contraseña desde la IP {ip}'),
(6, 'en', 'Blacklist recovery attempt', 'Blocked Recovery Attempt', 'Blacklisted user {user} tried password recovery from IP {ip}');

-- 7. Intento de login con usuario no activo
INSERT INTO notifications (should_send_email) VALUES (FALSE);
INSERT INTO notification_translations (notification_id, lang_code, description, subject, template_text) VALUES
(7, 'es', 'Intento de login con usuario no activo', 'Intento de acceso inactivo', 'El usuario inactivo {user} intentó acceder desde la IP {ip}'),
(7, 'en', 'Inactive user login attempt', 'Inactive Login Attempt', 'Inactive user {user} tried to login from IP {ip}');

-- 8. Intento de recuperacion de contraseña con usuario no activo
INSERT INTO notifications (should_send_email) VALUES (FALSE);
INSERT INTO notification_translations (notification_id, lang_code, description, subject, template_text) VALUES
(8, 'es', 'Intento de recuperacion con usuario no activo', 'Intento de recuperación inactivo', 'El usuario inactivo {user} intentó recuperar contraseña desde la IP {ip}'),
(8, 'en', 'Inactive user recovery attempt', 'Inactive Recovery Attempt', 'Inactive user {user} tried password recovery from IP {ip}');


INSERT INTO notifications (should_send_email) VALUES (FALSE);
INSERT INTO notification_translations (notification_id, lang_code, description, subject, template_text) VALUES
(9, 'es', 'Primer inicio de sesión no realizado a tiempo', 'Inicio de sesión pendiente expirado', 'El usuario {user} no inició sesión por primera vez dentro del plazo permitido.'),
(9, 'en', 'First login not completed on time', 'Pending First Login Expired', 'User {user} did not log in for the first time within the allowed time window.');

DELIMITER $$

CREATE TRIGGER trg_block_notifications_insert
BEFORE INSERT ON notifications
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Inserting into notifications is not allowed.';
END$$

CREATE TRIGGER trg_block_notifications_delete
BEFORE DELETE ON notifications
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Deleting from notifications is not allowed.';
END$$

DELIMITER ;


DELIMITER $$

CREATE TRIGGER trg_block_notification_translations_insert
BEFORE INSERT ON notification_translations
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Inserting into notification_translations is not allowed.';
END$$

CREATE TRIGGER trg_block_notification_translations_delete
BEFORE DELETE ON notification_translations
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Deleting from notification_translations is not allowed.';
END$$

CREATE TRIGGER trg_block_notification_translations_update
BEFORE UPDATE ON notification_translations
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Updating notification_translations is not allowed.';
END$$

DELIMITER ;

DELIMITER $$

CREATE TRIGGER trg_block_notifications_id_update
BEFORE UPDATE ON notifications
FOR EACH ROW
BEGIN
    IF NEW.id != OLD.id THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Updating the notification ID is not allowed.';
    END IF;
END$$

DELIMITER ;