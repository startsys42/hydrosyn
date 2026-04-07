DROP FUNCTION IF EXISTS public.get_login_attempts_with_user_email(uuid,int8);

CREATE OR REPLACE VIEW public.user_emails AS
SELECT id, email
FROM auth.users;


REVOKE ALL ON public.user_emails FROM public;
REVOKE ALL ON public.user_emails FROM authenticated;
REVOKE ALL ON public.user_emails FROM anon;


create or replace function public.get_login_attempts_with_user_email(p_user_id uuid,  p_system_id int8)
returns table (
    user_email varchar,
    reason text,
    attempt_created_at timestamptz
)
language plpgsql
security definer
as $$
begin
  
    if not exists (
        select 1
        from public.admin_users u join public.systems s on s.admin= u.user
        where u.user = p_user_id and u.is_active = true and s.id = p_system_id
    ) then
        raise exception 'Permission denied for this function';
    end if;

    
    return query
    select
        ue.email,
        la.reason,
        la.created_at
    from
        public.login_attempts la
    join
        public.user_emails ue on la.user = ue.id
        join public.systems_users su on la.user = su.user_id
    
    where
        la.created_at > su.associated_at and su.system = p_system_id
    order by
        la.created_at desc;
end;
$$;

GRANT EXECUTE ON FUNCTION public.get_login_attempts_with_user_email(uuid,int8) TO authenticated;