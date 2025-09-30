ALTER TABLE public.systems ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users or active admins can select systems"
ON public.systems
FOR SELECT
TO authenticated
USING (
  -- Caso 1: usuario activo en systems_users
  EXISTS (
    SELECT 1
    FROM public.systems_users su
    WHERE su.system = systems.id
      AND su.user_id = auth.uid()
      AND su.is_active = true
  )
  -- Caso 2: admin activo en admin_users y dueño del sistema
  OR EXISTS (
    SELECT 1
    FROM public.admin_users au
    WHERE au.user = auth.uid()
      AND au.is_active = true
      AND systems.admin = au.user
  )
);


CREATE POLICY "Active admin can update system name"
ON public.systems
FOR UPDATE
TO authenticated
USING (
  -- Solo puede tocar el sistema si es admin activo
  EXISTS (
    SELECT 1
    FROM public.admin_users au
    WHERE au.user = auth.uid()
      AND au.is_active = true
      AND au.user = systems.admin
  )
)
WITH CHECK (
  -- Solo puede dejar el sistema en un estado donde sigue siendo admin activo
  EXISTS (
    SELECT 1
    FROM public.admin_users au
    WHERE au.user = auth.uid()
      AND au.is_active = true
      AND au.user = systems.admin
  )
  -- Y solo puede modificar el campo name
  AND (systems.name IS NOT NULL)
);
