
USE hydrosyn_db;







CREATE TABLE rol_admin (
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNSIGNED NOT NULL,
  
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by INT UNSIGNED NOT NULL,

    CONSTRAINT fk_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT
); 

DELIMITER //
CREATE TRIGGER check_special_user_before_insert
BEFORE INSERT ON rol_admin
FOR EACH ROW
BEGIN
    IF NEW.user_id = 2 THEN
        IF EXISTS (SELECT 1 FROM rol_admin WHERE user_id = 2) THEN
            SIGNAL SQLSTATE '45000' 
            SET MESSAGE_TEXT = 'Only one record with user_id = 2 is allowed';
        END IF;
    END IF;
END//
DELIMITER ;

DELIMITER //
CREATE TRIGGER check_special_user_before_update
BEFORE UPDATE ON rol_admin
FOR EACH ROW
BEGIN
    IF NEW.user_id = 2 AND OLD.user_id != 2 THEN
        IF EXISTS (SELECT 1 FROM rol_admin WHERE user_id = 2 AND id != NEW.id) THEN
            SIGNAL SQLSTATE '45000' 
            SET MESSAGE_TEXT = 'Only one record with user_id = 2 is allowed';
        END IF;
    END IF;
END//
DELIMITER ;