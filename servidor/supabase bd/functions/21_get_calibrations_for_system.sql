create or replace function public.get_calibrations_for_system(
    p_system_id bigint,
    p_current_user uuid
)
returns table(
    id bigint,
    pump_id bigint,
    pump_name text,
    volume numeric,
    success boolean,
    created_at timestamptz,
    user_id uuid,
     user_email text

) as $$
begin
    return query
    select c.id,
           p.id as pump_id,
           p.name as pump_name,
           c.volume,
           c.success,
           c.created_at,
           u.id as user_id,
            u.email as user_email
    from public.calibrate c
    join public.pumps p on p.id = c.pump
    join auth.users u on u.id = c.user
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
    order by c.created_at desc;
end;
$$ language plpgsql security definer stable;