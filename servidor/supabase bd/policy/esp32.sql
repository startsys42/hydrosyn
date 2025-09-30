ALTER TABLE public.esp32 ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Only active system admins can select esp32"
ON public.esp32
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.systems s
    JOIN public.admin_users au
      ON s.admin = au.user
    WHERE s.id = esp32.system
      AND au.user = auth.uid()
      AND au.is_active = true
  )
);



-- INSERT
CREATE POLICY "Only active system admins can insert esp32"
ON public.esp32
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.systems s
    JOIN public.admin_users au
      ON s.admin = au.user
    WHERE s.id = esp32.system
      AND au.user = auth.uid()
      AND au.is_active = true
  )
);

-- UPDATE
CREATE POLICY "Only active system admins can update esp32"
ON public.esp32
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.systems s
    JOIN public.admin_users au
      ON s.admin = au.user
    WHERE s.id = esp32.system
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
    WHERE s.id = esp32.system
      AND au.user = auth.uid()
      AND au.is_active = true
  )
);

-- DELETE
CREATE POLICY "Only active system admins can delete esp32"
ON public.esp32
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.systems s
    JOIN public.admin_users au
      ON s.admin = au.user
    WHERE s.id = esp32.system
      AND au.user = auth.uid()
      AND au.is_active = true
  )
);