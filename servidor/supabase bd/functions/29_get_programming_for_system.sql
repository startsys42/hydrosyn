create or replace function public.get_programming_for_system(
    p_system_id bigint,
    p_current_user uuid
)
returns table(
    id bigint,
    pump_id bigint,
    pump_name text,
    day_of_week text,
    clock time,
    volume numeric
) as $$
begin
    return query
    select pp.id,
           p.id as pump_id,
           p.name as pump_name,
           pp.day_of_week,
           pp.clock,
           pp.volume
    from public.programming_pumps pp
    join public.pumps p on p.id = pp.pump
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
    order by pp.day_of_week, pp.clock;
end;
$$ language plpgsql security definer stable;