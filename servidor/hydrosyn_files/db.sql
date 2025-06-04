CREATE DATABASE IF NOT EXISTS info_app CHARACTER SET utf8mb4 COLLATE utf8mb4_general_cs;
USE info_app;


CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT NOT NULL,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by INT NOT NULL,
    CONSTRAINT fk_user_creator
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

CREATE TABLE sistemas (
    id INT PRIMARY KEY AUTO_INCREMENT NOT NULL,
    nombre_sistema VARCHAR(100) NOT NULL,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_baja TIMESTAMP DEFAULT NULL,
    creado_por INT NOT NULL,
    dado_de_baja_por INT DEFAULT NULL,
    CONSTRAINT fk_sistema_creador
        FOREIGN KEY (creado_por)
        REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT fk_sistema_baja
        FOREIGN KEY (dado_de_baja_por)
        REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);
