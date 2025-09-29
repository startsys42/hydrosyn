-- Función para eliminar usuarios huérfanos de Supabase
CREATE EXTENSION IF NOT EXISTS http;

CREATE OR REPLACE FUNCTION delete_auth_users(secret_key text) 
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    caller_id UUID;
    is_caller_admin BOOLEAN;
    supabase_url TEXT;
    service_key TEXT;
    response_status INT;
    orphaned_user RECORD; 
    deleted_count INT := 0;
    error_count INT := 0;
BEGIN
    -- 1️⃣ Validar la llamada usando el parámetro secreto
    IF secret_key IS NULL OR secret_key <> 'chsdrosHADSKADKAujy3746dff' THEN
        RAISE EXCEPTION 'Unauthorized call';
    END IF;

  

    -- 3️⃣ Configuración directa
    supabase_url := 'https://iolzdktanpnlofgfjorw.supabase.co';
    service_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvbHpka3RhbnBubG9mZ2Zqb3J3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDIxMzc1NCwiZXhwIjoyMDY5Nzg5NzU0fQ.WkCG_yk-NHjMh1dtPcLvwPnFtDAy-vNxFNPDeT4WrhA';

    -- 4️⃣ Buscar y eliminar usuarios huérfanos
    FOR orphaned_user IN 
        SELECT au.id, au.email
        FROM auth.users au
        WHERE NOT EXISTS (SELECT 1 FROM public.roles r WHERE r.user = au.id)
          AND NOT EXISTS (SELECT 1 FROM public.admin_users au2 WHERE au2.user = au.id)
          AND NOT EXISTS (SELECT 1 FROM public.systems_users su WHERE su.user_id = au.id)
   
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

    -- 5️⃣ Reporte final
    RAISE NOTICE 'Operation completed. Deleted: %, Errors: %', deleted_count, error_count;

END;
$$;