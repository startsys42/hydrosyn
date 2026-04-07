ALTER TABLE public.systems ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users or active admins can select systems"
ON public.systems
FOR SELECT
TO authenticated
USING (
  
  EXISTS (
    SELECT 1
    FROM public.systems_users su
    WHERE su.system = systems.id
      AND su.user_id = auth.uid()
      AND su.is_active = true
  )
  
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
  
  EXISTS (
    SELECT 1
    FROM public.admin_users au
    WHERE au.user = auth.uid()
      AND au.is_active = true
      AND au.user = systems.admin
  )
)
WITH CHECK (
  
  EXISTS (
    SELECT 1
    FROM public.admin_users au
    WHERE au.user = auth.uid()
      AND au.is_active = true
      AND au.user = systems.admin
  )
  
  AND (systems.name IS NOT NULL)
);
