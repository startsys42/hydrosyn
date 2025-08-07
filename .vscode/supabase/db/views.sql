CREATE OR REPLACE VIEW user_profiles_info AS
SELECT 
  p.user as user_id,
  p.is_active,
  u.email
FROM profile p
JOIN auth.users u ON p.user = u.id
LEFT JOIN roles r ON p.user = r.user
WHERE r.user IS NULL;


GRANT EXECUTE ON FUNCTION public.insert_attempts TO authenticated;

-- Para usuarios no logueados
GRANT EXECUTE ON FUNCTION public.insert_attempts TO anon;

create or replace function public.insert_attempts(
  reason text,
  user_id uuid
)
returns void
language plpgsql
security definer 
set search_path = public;
as $$
begin
  insert into public.login_attempts (reason, "user")
  values (reason, user_id);
 


end;
$$;