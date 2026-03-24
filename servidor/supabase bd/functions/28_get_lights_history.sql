CREATE OR REPLACE FUNCTION get_lights_history(
    p_system_id BIGINT,
    p_current_user UUID
)
RETURNS TABLE(
    id BIGINT,
    light_id BIGINT,
    action SMALLINT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    v_admin_active BOOLEAN;
BEGIN
    -- Verificar si el admin del sistema está activo
    SELECT EXISTS (
        SELECT 1 FROM public.systems s
        JOIN public.admin_users au ON au.user = s.admin
        WHERE s.id = p_system_id
        AND au.is_active = true
    ) INTO v_admin_active;

    -- Si el admin no está activo, nadie tiene acceso
    IF NOT v_admin_active THEN
        RAISE EXCEPTION 'System admin is inactive';
    END IF;

    -- Verificar que el usuario tiene acceso al sistema
    IF NOT EXISTS (
        SELECT 1 FROM public.systems s
        WHERE s.id = p_system_id
        AND (
            -- Es el admin
            s.admin = p_current_user
            OR
            -- Es usuario activo del sistema
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
        lh.action,
        lh.created_at
    FROM public.lights_history lh
    JOIN public.lights l ON l.id = lh.light_id
    WHERE l.system = p_system_id
    ORDER BY lh.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;