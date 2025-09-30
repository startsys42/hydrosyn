
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin active can select themselves"
ON admin_users
FOR SELECT
TO authenticated
USING (
  auth.uid() = "user" AND is_active = true
);