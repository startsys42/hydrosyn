


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
  name text NOT NULL CHECK (name ~ '^[A-Za-z0-9][A-Za-z0-9_ ]{1,28}[A-Za-z0-9]$'::text),
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
  name text NOT NULL   CHECK (name ~ '^[A-Za-z0-9][A-Za-z0-9_]{1,28}[A-Za-z0-9]$'::text),
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
  name text NOT NULL CHECK (name ~ '^[A-Za-z0-9][A-Za-z0-9_]{1,28}[A-Za-z0-9]$'::text),

  system bigint NOT NULL,
  CONSTRAINT tanks_pkey PRIMARY KEY (id),
  CONSTRAINT tanks_system_fkey FOREIGN KEY (system) REFERENCES public.systems(id) ON DELETE CASCADE
  ON UPDATE CASCADE
);








-- no ams d e20 tanques si no es admin, no insertar con nombre duplicado, no cmabair a nomber duplicado
-- coments



CREATE TABLE public.pumps (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  name text NOT NULL  CHECK (name ~ '^[A-Za-z0-9][A-Za-z0-9_]{1,28}[A-Za-z0-9]$'::text),
  esp32 bigint NOT NULL,
  gpio integer NOT NULL CHECK (gpio IN (2,4,5,12,13,14,15,18,19,21,22,23,25,26,27,32,33)),
  system bigint NOT NULL,
  origin bigint NOT NULL,
  destination bigint NOT NULL,
  CONSTRAINT pumps_pkey PRIMARY KEY (id),
  CONSTRAINT bombs_system_fkey FOREIGN KEY (system) REFERENCES public.systems(id),
   CONSTRAINT bombs_esp32_fkey FOREIGN KEY (esp32) REFERENCES public.esp32(id),
  CONSTRAINT bombs_destination_fkey FOREIGN KEY (destination) REFERENCES public.tanks(id)  ON DELETE RESTRICT
  ON UPDATE CASCADE,
  CONSTRAINT bombs_origin_fkey FOREIGN KEY (origin) REFERENCES public.tanks(id)  ON DELETE RESTRICT
  ON UPDATE CASCADE,
  CONSTRAINT unique_esp32_gpio UNIQUE (esp32, gpio) ,
  
    CONSTRAINT different_tanks CHECK (origin != destination)
);




CREATE TABLE public.records (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  tank bigint NOT NULL,
  "user" uuid not null,
  volume numeric(6,3) CHECK (volume > 0 and volume <= 999.999) NOT NULL,
  CONSTRAINT drainings_pkey PRIMARY KEY (id),
  CONSTRAINT drainings_tank_fkey FOREIGN KEY (tank) REFERENCES public.tanks(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT drainings_user_fkey FOREIGN KEY ("user") REFERENCES auth.users(id) ON DELETE RESTRICT ON UPDATE CASCADE
);










CREATE TABLE public.programming_pumps (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  pump bigint NOT NULL,
   volume numeric(6,3) NOT NULL CHECK (volume> 0 and volume <= 999.999),
    clock time NOT NULL,                  -- Hora del día en que se activa
      day_of_week day_of_week NOT NULL,
    
     
  CONSTRAINT programming_pumps_pkey PRIMARY KEY (id),
  CONSTRAINT programming_pumps_pump_fkey FOREIGN KEY (pump) REFERENCES public.pumps(id) ON DELETE CASCADE
  ON UPDATE CASCADE
  -- desd que momento
);




-- que pasa en las bmbas al borrar algo oa ctualizar algo


CREATE TABLE public.calibration (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  pump bigint NOT NULL,
   "user" uuid NOT NULL,
success BOOLEAN DEFAULT false,

  CONSTRAINT calibration_pkey PRIMARY KEY (id),
  CONSTRAINT calibration_pump_fkey FOREIGN KEY (pump) REFERENCES public.pumps(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT calibration_user_fkey FOREIGN KEY ("user") REFERENCES auth.users(id) ON DELETE RESTRICT ON UPDATE CASCADE

);




CREATE TABLE public.calibrate (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  pump bigint NOT NULL,
  volume numeric(6,3) CHECK (volume > 0 and volume <= 999.999) NOT NULL,
   "user" uuid NOT NULL,


  CONSTRAINT calibrate_pkey PRIMARY KEY (id),
  CONSTRAINT calibrate_pump_fkey FOREIGN KEY (pump) REFERENCES public.pumps(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT calibrate_user_fkey FOREIGN KEY ("user") REFERENCES auth.users(id) ON DELETE restrict ON UPDATE CASCADE

);








-- tbaal ultimov olumne tabla tanque limpio tabla gastos beneficios







CREATE TABLE public.records_pumps (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  pump bigint NOT NULL,
success BOOLEAN DEFAULT false not null,
  volume numeric(6,3) CHECK (volume > 0 and volume <= 999.999) NOT NULL,
  "user" uuid not null,
  CONSTRAINT records_pumps_pkey PRIMARY KEY (id),
  CONSTRAINT records_pumps_pump_fkey FOREIGN KEY (pump) REFERENCES public.pumps(id) ON DELETE CASCADE  ON UPDATE CASCADE,
  CONSTRAINT records_pumps_user_fkey FOREIGN KEY ("user") REFERENCES auth.users(id) ON UPDATE RESTRICT ON DELETE CASCADE
);


CREATE TABLE public.executions_pumps (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
   
    programming_id BIGINT NOT NULL REFERENCES public.programming_pumps(id) ON DELETE CASCADE on update cascade,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    success BOOLEAN DEFAULT false
);

-- luces


-- 1. Tabla de luces (sin is_active, con límite de 6 luces por sistema)
CREATE TABLE public.lights (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    name TEXT NOT NULL CHECK (name ~ '^[A-Za-z0-9][A-Za-z0-9_]{1,28}[A-Za-z0-9]$'::text),
    esp32 BIGINT NOT NULL,
    gpio INTEGER NOT NULL CHECK (gpio IN (2,4,5,12,13,14,15,18,19,21,22,23,25,26,27,32,33)),
    system BIGINT NOT NULL,
    CONSTRAINT lights_system_fkey FOREIGN KEY (system) REFERENCES public.systems(id) ON DELETE cascade ON UPDATE CASCADE,
    CONSTRAINT lights_esp32_fkey FOREIGN KEY (esp32) REFERENCES public.esp32(id) ON DELETE cascade ON UPDATE CASCADE,
    CONSTRAINT unique_esp32_gpio_lights UNIQUE (esp32, gpio)
);


-- 2. Crear la tabla con las restricciones necesarias
CREATE TABLE public.programming_lights (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    light BIGINT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    day_of_week day_of_week NOT NULL,
    is_active BOOLEAN DEFAULT false,
    CONSTRAINT programming_lights_light_fkey FOREIGN KEY (light) REFERENCES public.lights(id) ON DELETE cascade ON UPDATE CASCADE,
    CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

CREATE TABLE public.lights_history (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    light_id BIGINT NOT NULL,
    action SMALLINT NOT NULL,                -- 0 = apagado, 1 = encendido
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    CONSTRAINT lights_history_light_fkey FOREIGN KEY (light_id) REFERENCES public.lights(id) ON DELETE cascade ON UPDATE CASCADE,
    CONSTRAINT valid_action CHECK (action IN (0, 1))
);
