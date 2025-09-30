ALTER TABLE systems_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User or active admin can select systems_users"
ON public.systems_users
FOR SELECT
TO authenticated
USING (
  -- Caso 1: el usuario puede verse a sí mismo si está activo
  (auth.uid() = user_id AND is_active = true)
  
  -- Caso 2: o si es admin activo del sistema
  OR EXISTS (
    SELECT 1
    FROM public.systems s
    JOIN public.admin_users au
      ON s.admin = au.user
    WHERE s.id = systems_users.system
      AND au.user = auth.uid()
      AND au.is_active = true
  )
);
