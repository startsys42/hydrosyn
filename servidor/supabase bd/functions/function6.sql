
-- Función para eliminar usuario completamente de Supabase
CREATE EXTENSION IF NOT EXISTS http;

CREATE OR REPLACE FUNCTION delete_admin_user(target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    caller_id UUID;
    is_caller_admin BOOLEAN;
    service_key TEXT;
    supabase_url TEXT;
    response_status INT;
    orphaned_user RECORD; 
    deleted_count INT := 0;
    error_count INT := 0;
BEGIN
    -- 1. Verificar permisos del llamante
    caller_id := auth.uid();
    
    IF caller_id IS NULL THEN
        RAISE EXCEPTION 'User not authenticated';
    END IF;
    
    -- Verificar que el llamante es admin
    SELECT EXISTS (
        SELECT 1 FROM public.roles WHERE "user" = caller_id
    ) INTO is_caller_admin;
    
    IF NOT is_caller_admin THEN
        RAISE EXCEPTION 'Not authorized: admin role required';
    END IF;
    
    -- 2. Configuración DIRECTA (sin variables de BD)
    supabase_url := 'https://iolzdktanpnlofgfjorw.supabase.co';
    service_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvbHpka3RhbnBubG9mZ2Zqb3J3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDIxMzc1NCwiZXhwIjoyMDY5Nzg5NzU0fQ.WkCG_yk-NHjMh1dtPcLvwPnFtDAy-vNxFNPDeT4WrhA';
    
    -- 3. Primero eliminar de admin_users (si existe)
    DELETE FROM public.admin_users WHERE "user" = target_user_id;
    
    -- 4. Buscar y eliminar usuarios huérfanos
    FOR orphaned_user IN 
        SELECT au.id, au.email
        FROM auth.users au
        WHERE NOT EXISTS (SELECT 1 FROM public.roles r WHERE r.user = au.id)
        AND NOT EXISTS (SELECT 1 FROM public.admin_users au2 WHERE au2.user = au.id)
        AND NOT EXISTS (SELECT 1 FROM public.systems_users su WHERE su.user_id = au.id)
        AND au.id != caller_id
      
    LOOP
        BEGIN
            -- Llamar a la API de Auth para eliminar el usuario huérfano
            SELECT status
            INTO response_status
            FROM http((
                'DELETE',
                supabase_url || '/auth/v1/admin/users/' || orphaned_user.id,
                ARRAY[
                    ('Authorization', 'Bearer ' || service_key)::http_header,
                    ('apikey', service_key)::http_header
                ],
                NULL,
                NULL
            ));
            
            IF response_status = 200 THEN
                deleted_count := deleted_count + 1;
                RAISE NOTICE 'User deleted: % (%)', orphaned_user.email, orphaned_user.id;
            ELSE
                error_count := error_count + 1;
                RAISE NOTICE 'Error deleting user %: Status %', orphaned_user.email, response_status;
            END IF;
            
        EXCEPTION
            WHEN OTHERS THEN
                error_count := error_count + 1;
                RAISE NOTICE 'Exception deleting user %: %', orphaned_user.email, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE 'Operation completed. Deleted: %, Errors: %', deleted_count, error_count;
    
END;
$$;