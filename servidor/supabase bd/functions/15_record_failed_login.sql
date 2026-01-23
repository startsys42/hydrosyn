-- RPC SIMPLE para registrar intento de login fallido
CREATE OR REPLACE FUNCTION public.record_failed_login(
  p_email TEXT
)
RETURNS VOID  
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_reason TEXT;
BEGIN
  -- Buscar si el usuario existe
  SELECT id INTO v_user_id
  FROM auth.users 
  WHERE email = p_email
    AND deleted_at IS NULL
  LIMIT 1;

  -- Determinar el motivo
  IF v_user_id IS NULL THEN
    -- Usuario NO existe
    v_user_id := '00000000-0000-0000-0000-000000000000'::UUID;
    v_reason := 'User does not exist';
  ELSE
    -- Usuario SÍ existe, pero contraseña incorrecta
    v_reason := 'Invalid password';
  END IF;

  -- Insertar el intento fallido
  INSERT INTO public.login_attempts ("user", reason)
  VALUES (v_user_id, v_reason);

END;
$$;