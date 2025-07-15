CREATE DATABASE IF NOT EXISTS hydrosyn_db CHARACTER SET utf8mb4 COLLATE  utf8mb4_bin;
USE hydrosyn_db;

-- componenetes,e stadisticas ordenes permisoso

CREATE TABLE systems (
    id INT PRIMARY KEY AUTO_INCREMENT NOT NULL,
    system_name VARCHAR(100) NOT NULL UNIQUE, -- poenr restricicon nuemros guiones... historico
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deactivated_at TIMESTAMP DEFAULT NULL,
    created_by INT UNSIGNED NOT NULL,
    delete_possible  BOOLEAN NOT NULL DEFAULT  FALSE,
    deactivated_by INT UNSIGNED DEFAULT NULL,

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
    added_by INT UNSIGNED NOT NULL,
    deactivated_by INT UNSIGNED DEFAULT NULL,

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


CREATE TABLE system_users_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    system_id INT NOT NULL,
    user_id INT UNSIGNED NOT NULL,
    added_by INT UNSIGNED NOT NULL,
    removed_by INT UNSIGNED DEFAULT NULL,
    date_added TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    date_removed TIMESTAMP DEFAULT NULL,

    CONSTRAINT fk_su_hist_system
        FOREIGN KEY (system_id)
        REFERENCES systems(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_su_hist_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_su_hist_added_by
        FOREIGN KEY (added_by)
        REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_su_hist_removed_by
        FOREIGN KEY (removed_by)
        REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);
CREATE TABLE system_users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    system_id INT NOT NULL,
    user_id INT UNSIGNED NOT NULL,
   added_by INT UNSIGNED NOT NULL,
    date_added TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

 CONSTRAINT fk_su_system
        FOREIGN KEY (system_id)
        REFERENCES systems(id)
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
        ON UPDATE CASCADE
);


