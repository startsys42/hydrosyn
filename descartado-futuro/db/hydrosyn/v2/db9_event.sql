
USE hydrosyn_db;
-- en cofig si debria dejar el ultimor egistro quizas pro qeuin loc ambio, 
-- CEAR TRIGER VALORES NO BOOL VIEJOS Y NEUIVOS
-- me faltan los triggers que impiden borrar histiris abtes de arametrsod econfig
--ips...












-- falat completar ergistrosc ond atso d eip... en apssword history poern  triger en abse a tabald e config  y en email changes igual y comprobar valor viejo disinto al neuvo




DELIMITER //

CREATE EVENT weekly_maintenance_auto
ON SCHEDULE
    EVERY 1 DAY
    STARTS CONCAT(CURRENT_DATE + INTERVAL 1 DAY, ' 02:00:00')
DO
BEGIN
    -- Basic error handling (will stop on first error)
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        -- Fail silently (or add notification logic here)
    END;
    
    -- Execute maintenance procedures in order
    CALL reorganize_config_history_ids();
    CALL reorganize_delete_possible_users_history_ids();
    CALL reorganize_twofa_activation_history_ids();
    CALL reorganize_user_activation_history_ids();
    CALL reorganize_email_verification_history_ids();
    CALL reorganize_password_policy_history_ids();
    CALL reorganize_password_special_chars_history_ids();
    CALL reorganize_username_policy_history_ids();
    CALL reorganize_username_blacklist_history_ids();
    CALL reorganize_user_password_history_ids();
    CALL reorganize_user_email_changes_ids();
    CALL reorganize_username_history_ids();
    CALL reorganize_login_attempts_ids();
    CALL reorganize_sessions_ids();
    CALL reorganize_notification_should_send_email_history_ids();
    CALL reorganize_notification_email_history_ids();
    CALL reorganize_notification_events_ids();
    CALL reorganize_role_ids();
    CALL reorganize_role_permissions_ids();
    CALL reorganize_role_permissions_history_ids();
    CALL reorganize_role_users_history_ids();


END //

DELIMITER ;
