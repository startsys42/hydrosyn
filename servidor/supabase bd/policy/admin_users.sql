

DROP POLICY IF EXISTS "Admin active can select themselves" ON admin_users;


ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Admin active can select themselves"
ON admin_users
FOR SELECT
USING (
    is_active = true
    AND (
        auth.uid() = "user"
        OR
        EXISTS (
            SELECT 1 
            FROM systems s
            WHERE s.admin = admin_users."user"
            AND (
                s.admin = auth.uid()
                OR
                EXISTS (
                    SELECT 1 
                    FROM systems_users su
                    WHERE su.system = s.id
                    AND su.user_id = auth.uid()
                    AND su.is_active = true
                )
            )
        )
    )
);