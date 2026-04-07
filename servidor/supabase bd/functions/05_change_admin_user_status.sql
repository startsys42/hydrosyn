
CREATE OR REPLACE FUNCTION change_admin_user_status(target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    caller_id UUID;
    is_caller_admin BOOLEAN;
BEGIN
    
    caller_id := auth.uid();
    
    IF caller_id IS NULL THEN
        RAISE EXCEPTION 'User not authenticated';
    END IF;
    

    SELECT EXISTS (
        SELECT 1 FROM public.roles WHERE "user" = caller_id
    ) INTO is_caller_admin;
    
    IF NOT is_caller_admin THEN
        RAISE EXCEPTION 'Not authorized: admin role required';
    END IF;
    
  
    UPDATE public.admin_users 
    SET is_active = NOT is_active
    WHERE "user" = target_user_id;
    
  
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found in admin_users';
    END IF;
    
    
END;
$$;