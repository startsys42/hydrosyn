ALTER TABLE public.system_secrets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Only active system admins can select system_secrets"
ON public.system_secrets
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.systems s
    JOIN public.admin_users au
      ON s.admin = au.user
    WHERE s.id = system_secrets.system
      AND au.user = auth.uid()
      AND au.is_active = true
  )
);


CREATE POLICY "Active admin can update system secret code"
ON public.system_secrets
FOR UPDATE
TO authenticated
USING (
  -- Puede tocar el secreto si es admin activo del sistema
  EXISTS (
    SELECT 1
    FROM public.systems s
    JOIN public.admin_users au
      ON au.user = s.admin
    WHERE s.id = system_secrets.system
      AND au.user = auth.uid()
      AND au.is_active = true
  )
)
WITH CHECK (
  -- Después de la actualización sigue teniendo que ser admin activo
  EXISTS (
    SELECT 1
    FROM public.systems s
    JOIN public.admin_users au
      ON au.user = s.admin
    WHERE s.id = system_secrets.system
      AND au.user = auth.uid()
      AND au.is_active = true
  )
  -- Y que no modifique nada más que el campo code
  AND (system_secrets.code IS NOT NULL)
);
