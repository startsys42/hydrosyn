create or replace function delete_login_attempts_between(
  p_from timestamptz,
  p_to timestamptz
)
returns void
language plpgsql
security definer
as $$
begin
  -- check that the user is in roles
  if not exists (
    select 1
    from public.roles
    where "user" = auth.uid()
  ) then
    raise exception 'Not authorized';
  end if;

  delete from public.login_attempts
  where created_at >= p_from
    and created_at <= p_to;
end;
$$;

