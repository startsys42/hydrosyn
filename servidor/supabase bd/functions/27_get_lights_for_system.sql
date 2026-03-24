CREATE OR REPLACE FUNCTION get_lights_for_system(
    p_system_id BIGINT,
    p_current_user UUID
)
RETURNS TABLE(
    id BIGINT,
    name TEXT,
    gpio INTEGER,
    esp32_id BIGINT,
    esp32_name TEXT,
    system_id BIGINT
) AS $$
BEGIN
    -- Verificar que el usuario tiene acceso al sistema
    IF NOT EXISTS (
        SELECT 1 FROM public.systems s
        WHERE s.id = p_system_id
        AND (
            -- Es admin activo
            s.admin = p_current_user
            AND EXISTS (
                SELECT 1 FROM public.admin_users au
                WHERE au.user = p_current_user AND au.is_active = true
            )
            OR
            -- O es usuario activo del sistema
            EXISTS (
                SELECT 1 FROM public.systems_users su
                WHERE su.system = p_system_id
                AND su.user_id = p_current_user
                AND su.is_active = true
            )
        )
    ) THEN
        RAISE EXCEPTION 'Access denied to system %', p_system_id;
    END IF;

    RETURN QUERY
    SELECT 
        l.id,
        l.name,
        l.gpio,
        e.id AS esp32_id,
        e.name AS esp32_name,
        l.system AS system_id
    FROM public.lights l
    JOIN public.esp32 e ON e.id = l.esp32
    WHERE l.system = p_system_id
    ORDER BY l.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;