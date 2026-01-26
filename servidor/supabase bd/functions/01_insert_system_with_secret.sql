create or replace function insert_system_with_secret(
  system_name text,
  admin_id uuid,
  secret_value text
)
returns table(system_id int8) as $$
declare
  new_system_id int8;
  is_admin_active boolean;
begin
 SELECT is_active INTO is_admin_active
  FROM admin_users
  WHERE "user" = admin_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Admin user not found';
  END IF;
  
  IF NOT is_admin_active THEN
    RAISE EXCEPTION 'Admin user is not active';
  END IF;
IF EXISTS (
    SELECT 1
    FROM systems
    WHERE admin = admin_id
      AND name = system_name
  ) THEN
    RAISE EXCEPTION 'A system with this name already exists for this admin';
  END IF;
  -- Validar que no exista secret duplicado para sistemas de este admin
  if exists (
    select 1
    from systems s
    join system_secrets ss on ss.system = s.id
    where s.admin = admin_id
      and ss.code= secret_value
  ) then
    raise exception 'The secret already exists for another system of this admin';
  end if;

  -- Insertar el system
  insert into systems(name, admin)
  values (system_name, admin_id)
  returning id into new_system_id;

  -- Insertar el secret asociado
  insert into system_secrets(system, code)
  values (new_system_id, secret_value);

  -- Devolver el id del system
   RETURN QUERY SELECT new_system_id;  -- Sin conversión
  --return query select new_system_id::uuid;
end;
$$ language plpgsql security definer;