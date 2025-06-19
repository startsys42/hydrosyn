-- 1. Crear base y usuario
CREATE DATABASE IF NOT EXISTS session_db CHARACTER SET utf8mb4 COLLATE  utf8mb4_bin;
USE session_db;







CREATE TABLE secret_keys (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    secret_value TEXT NOT NULL,
    key_type ENUM('jwt_access', 'jwt_refresh', 'session', 'password_reset') NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    rotated_at TIMESTAMP NULL,
    rotated_by INT,  -- ID del admin que hizo el cambio (puedes usar ID del sistema de usuarios)
    CONSTRAINT uq_key_type_name UNIQUE (key_type, active)
);


CREATE TABLE auth_durations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_type ENUM('session_web', 'session_mobile', 'jwt_access', 'jwt_refresh', 'password_reset_token') NOT NULL UNIQUE,
    duration_minutes INT NOT NULL,  -- duración en minutos
    renewable BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by INT
);

