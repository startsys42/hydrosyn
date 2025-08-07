CREATE OR REPLACE VIEW user_profiles_info AS
SELECT 
  p.user as user_id,
  p.is_active,
  u.email
FROM profile p
JOIN auth.users u ON p.user = u.id
LEFT JOIN roles r ON p.user = r.user
WHERE r.user IS NULL;


create or replace function insert_attempts(
  reason text,
  user_id uuid
)
returns uuid
language plpgsql
as $$
declare
  new_attempt_id int8;
begin
  insert into login_attempts (reason, user)
  values (reason, user_id)
  returning id into new_attempt_id;

  return new_attempt_id;
end;
$$;