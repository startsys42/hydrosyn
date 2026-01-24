CREATE OR REPLACE FUNCTION public.record_failed_login(
  p_user UUID,
  p_reason TEXT
)
RETURNS VOID  
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Solo insertar si se pasa un usuario válido
  IF p_user IS NOT NULL THEN
    INSERT INTO public.login_attempts("user", reason)
    VALUES (p_user, p_reason);
  END IF;
END;
$$;