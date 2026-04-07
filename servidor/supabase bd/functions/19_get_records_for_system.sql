create or replace function public.get_records_for_system(
    p_system_id bigint,
    p_current_user uuid  
)
returns table(
    id bigint,
    created_at timestamptz,
    volume numeric,
    tank_id bigint,
    tank_name text,
    tank_type public.tank_type,
    user_id uuid,
    user_email text
) as $$
begin
    
    if not exists (
        select 1
        from public.admin_users a
        join public.systems s on s.admin = a."user"
        where a."user" = p_current_user
          and a.is_active = true
          and s.id = p_system_id
    ) then
        
        if not exists (
            select 1
            from public.systems_users su
            where su.user_id = p_current_user
              and su.is_active = true
              and su.system = p_system_id
        ) then
            raise exception 'Unauthorized: user is not active in this system';
        end if;
    end if;

    
    return query
    select 
        r.id,
        r.created_at,
        r.volume,
        t.id as tank_id,
        t.name as tank_name,
        t.type as tank_type,
        r."user" as user_id,
        u.email::text as user_email
    from public.records r
    join public.tanks t on r.tank = t.id
    join auth.users u on r."user" = u.id
    where t.system = p_system_id
    order by r.created_at desc;
end;
$$ language plpgsql security definer stable;