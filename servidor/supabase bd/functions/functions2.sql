DROP FUNCTION IF EXISTS public.get_admin_login_attempts_with_user_email(uuid);

CREATE OR REPLACE VIEW public.user_emails AS
SELECT id, email
FROM auth.users;

-- Revocar acceso directo
REVOKE ALL ON public.user_emails FROM public;
REVOKE ALL ON public.user_emails FROM authenticated;
REVOKE ALL ON public.user_emails FROM anon;

-- Crear función que usa la vista
create or replace function public.get_admin_login_attempts_with_user_email(p_user_id uuid)
returns table (
    user_email varchar,
    reason text,
    attempt_created_at timestamptz
)
language plpgsql
security definer
as $$
begin
    -- Verificar que el usuario tenga rol "admin"
    if not exists (
        select 1
        from public.roles r
        where r.user = p_user_id
    ) then
        raise exception 'Permission denied for this function';
    end if;

    -- Retornar los intentos de login
    return query
    select
        ue.email,
        la.reason,
        la.created_at
    from
        public.login_attempts la
    join
        public.user_emails ue on la.user = ue.id
    join
        public.admin_users a on ue.id = a.user
    where
        a.created_at < la.created_at
    order by
        la.created_at desc;
end;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_login_attempts_with_user_email(uuid) TO authenticated;