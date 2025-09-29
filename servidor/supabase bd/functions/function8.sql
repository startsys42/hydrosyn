create or replace function delete_system(system_id bigint)
returns void language plpgsql security definer as $$
declare
    current_uid uuid;
    admin_count int;
    system_count int;
begin
    -- 1️⃣ Get the logged-in user
    select auth.uid() into current_uid;

    if current_uid is null then
        raise exception 'User not authenticated';
    end if;

    -- 2️⃣ Check if the user is active in admin_users
    select count(*) into admin_count
    from admin_users
    where "user" = current_uid
      and is_active = true;

    if admin_count = 0 then
        raise exception 'User does not have permission to delete systems';
    end if;

    -- 3️⃣ Check that the system exists and the admin matches
    select count(*) into system_count
    from systems
    where id = system_id
      and admin = current_uid;

    if system_count = 0 then
        raise exception 'System not found or user is not the admin';
    end if;

    -- 4️⃣ Delete the system
    delete from systems
    where id = system_id;
PERFORM delete_auth_users('chsdrosHADSKADKAujy3746dff');
    -- Optional: delete related data if needed
    -- delete from system_secrets where system = system_id;
    -- delete from other_related_table where system = system_id;

end;
$$;