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
