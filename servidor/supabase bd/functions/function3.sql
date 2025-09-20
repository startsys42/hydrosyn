create or replace function public.get_admin_users_with_emails()
returns table (
    id bigint,
    "user" uuid,
    is_active boolean,
    email varchar
)
language sql
security definer
as $$
    -- Reemplaza 'SUPER_ADMIN_USER_ID' por el UUID del super-admin
    select 
        au.id,
        au.user,
        au.is_active,
        u.email
    from public.admin_users au
    join auth.users u on u.id = au.user
     where exists (
        select 1
        from public.roles r
        where r.user = auth.uid()
    );
$$;



grant execute on function public.get_admin_users_with_emails() to authenticated;
