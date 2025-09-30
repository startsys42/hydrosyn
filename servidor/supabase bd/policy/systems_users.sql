ALTER TABLE systems_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User or active admin can select systems_users"
ON public.systems_users
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id AND is_active = true
  OR is_admin_of_system(auth.uid(), system)
);
