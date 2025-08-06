CREATE OR REPLACE VIEW user_profiles_info AS
SELECT 
  p.user as user_id,
  p.is_active,
  u.email
FROM profile p
JOIN auth.users u ON p.user = u.id
LEFT JOIN roles r ON p.user = r.user
WHERE r.user IS NULL;