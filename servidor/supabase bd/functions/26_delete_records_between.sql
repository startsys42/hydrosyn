create or replace function public.delete_records_between(
  p_from timestamptz,
  p_to timestamptz,
  p_system_id bigint,
  p_user_id uuid
)
returns void
language plpgsql
security definer
as $$
begin

  
  if not exists (
    select 1
    from public.admin_users a
    join public.systems s on s.admin = a."user"
    where a."user" = p_user_id
      and a.is_active
      and s.id = p_system_id
  )
  and not exists (
    select 1
    from public.systems_users su
    where su.user_id = p_user_id
      and su.system = p_system_id
      and su.is_active
  )
  then
    raise exception 'Not authorized';
  end if;

  delete from public.records r
  using public.tanks t
  where r.tank = t.id
  and t.system = p_system_id
  and r.created_at between p_from and p_to;

end;
$$;