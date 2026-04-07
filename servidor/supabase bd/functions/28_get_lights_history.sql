CREATE OR REPLACE FUNCTION get_lights_history(
    p_system_id BIGINT,
    p_current_user UUID
)
RETURNS TABLE(
    id BIGINT,
    light_id BIGINT,
     light_name TEXT,
    action SMALLINT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    v_admin_active BOOLEAN;
BEGIN
    
    SELECT EXISTS (
        SELECT 1 FROM public.systems s
        JOIN public.admin_users au ON au.user = s.admin
        WHERE s.id = p_system_id
        AND au.is_active = true
    ) INTO v_admin_active;

    
    IF NOT v_admin_active THEN
        RAISE EXCEPTION 'System admin is inactive';
    END IF;

    
    IF NOT EXISTS (
        SELECT 1 FROM public.systems s
        WHERE s.id = p_system_id
        AND (
            
            s.admin = p_current_user
            OR
            
            EXISTS (
                SELECT 1 FROM public.systems_users su
                WHERE su.system = p_system_id
                AND su.user_id = p_current_user
                AND su.is_active = true
            )
        )
    ) THEN
        RAISE EXCEPTION 'User not authorized';
    END IF;

    RETURN QUERY
    SELECT 
        lh.id,
        lh.light_id,
         l.name AS light_name, 
        lh.action,
        lh.created_at
    FROM public.lights_history lh
    JOIN public.lights l ON l.id = lh.light_id
    WHERE l.system = p_system_id
    ORDER BY lh.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;