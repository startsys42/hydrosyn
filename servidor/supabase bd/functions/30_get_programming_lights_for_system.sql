create or replace function public.get_programming_lights_for_system(
    p_system_id bigint,
    p_current_user uuid
)
returns table(
    id bigint,
    light_id bigint,
    light_name text,
    day_of_week text,
    start_time time,
    end_time time,
    is_active boolean
) as $$
begin
    return query
    select pl.id,
           l.id as light_id,
           l.name as light_name,
           pl.day_of_week::text as day_of_week,
           pl.start_time,
           pl.end_time,
           pl.is_active
    from public.programming_lights pl
    join public.lights l on l.id = pl.light
    where l.system_id = p_system_id
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
    order by pl.day_of_week, pl.start_time;
end;
$$ language plpgsql security definer stable;