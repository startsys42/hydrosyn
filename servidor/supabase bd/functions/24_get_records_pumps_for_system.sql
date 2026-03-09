create or replace function get_records_pumps_for_system(
    p_system_id bigint,
    p_current_user uuid
)
returns table (
    id bigint,
    volume numeric,
    success boolean,
    created_at timestamp,
    pump_id bigint,
    pump_name text,
    user_id uuid,
    user_email text
) as $$
begin
    return query
    select
        r.id,
        r.volume,
        r.success,
        r.created_at,
        p.id as pump_id,
        p.name as pump_name,
        u.id as user_id,
        u.email::text as user_email
    from records_pumps r
    join pumps p on r.pump = p.id
    join auth.users u on r.user = u.id
    where p.system = p_system_id
    and (
          exists (
              select 1
              from public.admin_users a
              join public.systems s on s.admin = a."user"
              where a."user" = p_current_user
                and a.is_active
                and s.id = p_system_id
          )
          or exists (
              select 1
              from public.systems_users su
              where su.user_id = p_current_user
                and su.is_active
                and su.system = p_system_id
          )
      )
    order by r.created_at desc;
end;
$$ language plpgsql security definer;