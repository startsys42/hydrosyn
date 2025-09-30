ALTER TABLE public.tanks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Only active system admins can select tanks"
ON public.tanks
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.systems s
    JOIN public.admin_users au
      ON s.admin = au.user
    WHERE s.id = tanks.system
      AND au.user = auth.uid()
      AND au.is_active = true
  )
);


-- INSERT
CREATE POLICY "Only active system admins can insert tanks"
ON public.tanks
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.systems s
    JOIN public.admin_users au
      ON s.admin = au.user
    WHERE s.id = tanks.system
      AND au.user = auth.uid()
      AND au.is_active = true
  )
);

-- UPDATE
CREATE POLICY "Only active system admins can update tanks"
ON public.tanks
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.systems s
    JOIN public.admin_users au
      ON s.admin = au.user
    WHERE s.id = tanks.system
      AND au.user = auth.uid()
      AND au.is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.systems s
    JOIN public.admin_users au
      ON s.admin = au.user
    WHERE s.id = tanks.system
      AND au.user = auth.uid()
      AND au.is_active = true
  )
);

-- DELETE
CREATE POLICY "Only active system admins can delete tanks"
ON public.tanks
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.systems s
    JOIN public.admin_users au
      ON s.admin = au.user
    WHERE s.id = tanks.system
      AND au.user = auth.uid()
      AND au.is_active = true
  )
);