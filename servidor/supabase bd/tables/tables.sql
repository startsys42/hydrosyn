-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.


CREATE TABLE public.admin_users (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  "user" uuid NOT NULL DEFAULT auth.uid() UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  CONSTRAINT admin_users_pkey PRIMARY KEY (id),
  CONSTRAINT admin_users_user_fkey FOREIGN KEY ("user") REFERENCES auth.users(id) ON DELETE CASCADE
  ON UPDATE CASCADE
);

CREATE TABLE public.systems (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  name text NOT NULL CHECK (name ~ '^[A-Za-z0-9](?:[A-Za-z0-9_ ]{1,28}[A-Za-z0-9])?$'::text),
  admin uuid NOT NULL DEFAULT auth.uid(),
  CONSTRAINT systems_pkey PRIMARY KEY (id),
  CONSTRAINT systems_admin_fkey1 FOREIGN KEY (admin) REFERENCES public.admin_users("user") ON DELETE CASCADE
  ON UPDATE CASCADE
);

CREATE TABLE public.roles (
  id smallint GENERATED ALWAYS AS IDENTITY NOT NULL,
  "user" uuid NOT NULL UNIQUE,
  CONSTRAINT roles_pkey PRIMARY KEY (id),
  CONSTRAINT roles_user_fkey FOREIGN KEY ("user") REFERENCES auth.users(id) ON DELETE RESTRICT
  ON UPDATE CASCADE
);


CREATE TABLE public.systems_users (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  system bigint NOT NULL,
  user_id uuid NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  reason text NOT NULL,
  associated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT systems_users_pkey PRIMARY KEY (id),
  CONSTRAINT systems_users_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
  ON UPDATE CASCADE,
  CONSTRAINT systems_users_system_fkey FOREIGN KEY (system) REFERENCES public.systems(id) ON DELETE CASCADE
  ON UPDATE CASCADE
);


CREATE TABLE public.login_attempts (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  reason text NOT NULL,
  "user" uuid NOT NULL,
  CONSTRAINT login_attempts_pkey PRIMARY KEY (id),
  CONSTRAINT login_attempts_user_fkey FOREIGN KEY ("user") REFERENCES auth.users(id)  ON DELETE CASCADE
  ON UPDATE CASCADE
);



CREATE TABLE public.esp32 (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  system bigint NOT NULL,
  name text NOT NULL   CHECK (name ~ '^[A-Za-z0-9](?:[A-Za-z0-9_]{1,28}[A-Za-z0-9])?$'::text),
  CONSTRAINT esp32_pkey PRIMARY KEY (id),
  CONSTRAINT esp32_system_fkey FOREIGN KEY (system) REFERENCES public.systems(id)  ON DELETE CASCADE
  ON UPDATE CASCADE
);


CREATE TABLE public.system_secrets (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  system bigint NOT NULL UNIQUE,
  code text NOT NULL CHECK (length(code) >= 10 AND length(code) <= 30 AND code ~ '^[A-Za-z0-9]+$'::text),
  CONSTRAINT system_secrets_pkey PRIMARY KEY (id),
  CONSTRAINT system_secrets_system_fkey FOREIGN KEY (system) REFERENCES public.systems(id) ON DELETE CASCADE
  ON UPDATE CASCADE
);



CREATE TABLE public.tanks (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  type public.tank_type NOT NULL,
  name text NOT NULL CHECK (name ~ '^[A-Za-z0-9](?:[A-Za-z0-9_]{1,28}[A-Za-z0-9])?$'::text),
  system bigint NOT NULL,
  CONSTRAINT tanks_pkey PRIMARY KEY (id),
  CONSTRAINT tanks_system_fkey FOREIGN KEY (system) REFERENCES public.systems(id) ON DELETE CASCADE
  ON UPDATE CASCADE
);





-- no ams d e20 tanques si no es admin, no insertar con nombre duplicado, no cmabair a nomber duplicado
-- coments

CREATE TABLE public.calibrate (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  pump bigint NOT NULL,
  volume numeric,
  user uuid NOT NULL DEFAULT auth.uid(),
  temperature numeric NOT NULL CHECK (temperature >= 0::numeric AND temperature <= 99.99),
  salinity numeric NOT NULL CHECK (salinity >= 0::numeric AND salinity <= 99.99),
  mass numeric NOT NULL CHECK (mass > 0::numeric AND mass <= 5000.000),
  CONSTRAINT calibrate_pkey PRIMARY KEY (id),
  CONSTRAINT calibrate_pump_fkey FOREIGN KEY (pump) REFERENCES public.pumps(id),
  CONSTRAINT calibrate_user_fkey FOREIGN KEY (user) REFERENCES auth.users(id)
);
CREATE TABLE public.drainings (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  tank bigint NOT NULL,
  volume numeric,
  CONSTRAINT drainings_pkey PRIMARY KEY (id),
  CONSTRAINT drainings_tank_fkey FOREIGN KEY (tank) REFERENCES public.tanks(id)
);










CREATE TABLE public.programming_pumps (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  pump bigint NOT NULL,
  monday numeric,
  tuesday numeric,
  wednesday numeric,
  thursday numeric,
  friday numeric,
  saturday numeric,
  sunday numeric,
  CONSTRAINT programming_pumps_pkey PRIMARY KEY (id),
  CONSTRAINT programming_pumps_pump_fkey FOREIGN KEY (pump) REFERENCES public.pumps(id)
);
CREATE TABLE public.pumps (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  name text NOT NULL UNIQUE,
  pin integer NOT NULL UNIQUE,
  system bigint NOT NULL,
  origin bigint NOT NULL,
  destination bigint NOT NULL,
  CONSTRAINT pumps_pkey PRIMARY KEY (id),
  CONSTRAINT bombs_system_fkey FOREIGN KEY (system) REFERENCES public.systems(id),
  CONSTRAINT bombs_destination_fkey FOREIGN KEY (destination) REFERENCES public.tanks(id),
  CONSTRAINT bombs_origin_fkey FOREIGN KEY (origin) REFERENCES public.tanks(id)
);
CREATE TABLE public.records_pumps (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  pump bigint NOT NULL,
  volume numeric NOT NULL,
  user uuid,
  CONSTRAINT records_pumps_pkey PRIMARY KEY (id),
  CONSTRAINT records_pumps_pump_fkey FOREIGN KEY (pump) REFERENCES public.pumps(id),
  CONSTRAINT records_pumps_user_fkey FOREIGN KEY (user) REFERENCES auth.users(id)
);




-- luces y camaras
