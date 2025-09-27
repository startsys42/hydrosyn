-- Función para activar/desactivar usuario admin SIN RETORNO
CREATE OR REPLACE FUNCTION change_admin_user_status(target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    caller_id UUID;
    is_caller_admin BOOLEAN;
BEGIN
    -- 1. Obtener UID del usuario que llama la función
    caller_id := auth.uid();
    
    IF caller_id IS NULL THEN
        RAISE EXCEPTION 'User not authenticated';
    END IF;
    
    -- 2. Verificar que el llamante está en public.roles (es admin)
    SELECT EXISTS (
        SELECT 1 FROM public.roles WHERE "user" = caller_id
    ) INTO is_caller_admin;
    
    IF NOT is_caller_admin THEN
        RAISE EXCEPTION 'Not authorized: admin role required';
    END IF;
    
    -- 3. Cambiar el estado is_active al valor contrario
    UPDATE public.admin_users 
    SET is_active = NOT is_active
    WHERE "user" = target_user_id;
    
    -- Si no se actualizó ninguna fila, el usuario no existe
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found in admin_users';
    END IF;
    
    -- No retorna nada (VOID)
END;
$$;