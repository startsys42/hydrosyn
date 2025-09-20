create or replace function insert_system_with_secret(
  system_name text,
  admin_id uuid,
  secret_value text
)
returns table(id uuid) as $$
declare
  new_system_id uuid;
begin
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
      and ss.secret = secret_value
  ) then
    raise exception 'The secret already exists for another system of this admin';
  end if;

  -- Insertar el system
  insert into systems(name, admin)
  values (system_name, admin_id)
  returning id into new_system_id;

  -- Insertar el secret asociado
  insert into system_secrets(system, secret)
  values (new_system_id, secret_value);

  -- Devolver el id del system
  return query select new_system_id as id;
end;
$$ language plpgsql;