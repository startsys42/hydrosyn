CREATE OR REPLACE FUNCTION associate_user_to_system(
    p_admin_uid UUID,
    p_system_id BIGINT,
    p_user_id UUID
)
RETURNS VOID AS $$
BEGIN
   
    IF NOT EXISTS (
        SELECT 1 FROM admin_users
        WHERE "user" = p_admin_uid AND is_active = true
    ) THEN
        RAISE EXCEPTION 'Unauthorized: not an admin';
    END IF;

   
    IF NOT EXISTS (
        SELECT 1 FROM systems
        WHERE id = p_system_id AND admin = p_admin_uid
    ) THEN
        RAISE EXCEPTION 'Unauthorized: admin does not belong to this system';
    END IF;

   
    IF NOT EXISTS (
        SELECT 1 FROM auth.users WHERE id = p_user_id
    ) THEN
        RAISE EXCEPTION 'User does not exist';
    END IF;

  
    IF EXISTS (
        SELECT 1 FROM systems_users
        WHERE system = p_system_id AND user_id = p_user_id
    ) THEN
        RAISE EXCEPTION 'User already associated to this system';
    END IF;

    
    INSERT INTO systems_users (system, user_id, is_active, associated_at)
    VALUES (p_system_id, p_user_id, true, NOW());

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
