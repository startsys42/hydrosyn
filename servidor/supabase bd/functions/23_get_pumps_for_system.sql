create or replace function public.get_pumps_for_system(
    p_system_id bigint,
    p_current_user uuid
)
returns table(
    id bigint,
    name text,
    gpio integer,
    system_id bigint,
    origin_id bigint,
    origin_name text,
    destination_id bigint,
    destination_name text,
    esp32_id bigint,
    esp32_name text
) as $$
begin
    return query
    select p.id,
           p.name,
           p.gpio,
           p.system,
           o.id as origin_id,
           o.name as origin_name,
           d.id as destination_id,
           d.name as destination_name,
           e.id as esp32_id,
           e.name as esp32_name
    from public.pumps p
    join public.tanks o on o.id = p.origin
    join public.tanks d on d.id = p.destination
    join public.esp32 e on e.id = p.esp32
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
    order by p.name;
end;
$$ language plpgsql security definer stable;