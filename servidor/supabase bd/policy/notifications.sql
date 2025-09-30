ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Insert login attempts for non-privileged users"
ON public.login_attempts
FOR INSERT
TO authenticated
WITH CHECK (
    -- Solo pueden insertar su propio UID
    "user" = auth.uid()
    AND NOT EXISTS (
        SELECT 1
        FROM public.roles r
        WHERE r.user = auth.uid()
    )
    AND NOT EXISTS (
        SELECT 1
        FROM public.admin_users a
        WHERE a.user = auth.uid() AND a.is_active = true
    )
    AND NOT EXISTS (
        SELECT 1
        FROM public.systems_users s
        WHERE s.user_id = auth.uid() AND s.is_active = true)
         AND (
        EXISTS (
            SELECT 1
            FROM public.admin_users a
            WHERE a.user = auth.uid()
        )
        OR EXISTS (
            SELECT 1
            FROM public.systems_users s
            WHERE s.user_id = auth.uid()
        )
    )
     AND reason = 'Login attempt with a deactivated user'
);
