


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
  volume numeric(9,6) CHECK (volume > 0 and volume <= 999.999999) NOT NULL,
  system bigint NOT NULL,
  CONSTRAINT tanks_pkey PRIMARY KEY (id),
  CONSTRAINT tanks_system_fkey FOREIGN KEY (system) REFERENCES public.systems(id) ON DELETE CASCADE
  ON UPDATE CASCADE
);








-- no ams d e20 tanques si no es admin, no insertar con nombre duplicado, no cmabair a nomber duplicado
-- coments





CREATE TABLE public.expenses(
    id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    "user" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE ON UPDATE CASCADE,
 amount numeric(12,2) NOT NULL CHECK (amount >= 0),          
    extra_amount numeric(12,2)  CHECK (extra_amount >= 0), 
    extra_units varchar(10),                                      
    concepts varchar(50) NOT NULL,                              

    -- CHECK: solo letras en extra_units
    CONSTRAINT extra_units_letters CHECK (extra_units ~ '^[A-Za-z]*$'),

    -- CHECK: si extra_amount > 0, extra_units NO puede ser nulo ni vacío
    CONSTRAINT extra_units_required_if_extra_amount CHECK (
        (extra_amount IS NULL) OR (extra_units IS NOT NULL AND extra_units <> '')
    ),
-- CHECK: concepts entre 3 y 50 caracteres y solo letras, números y espacios
    -- Concepts: 3-50 caracteres, solo letras, números y espacios, no empieza/termina con espacio, no 2 espacios seguidos
    CONSTRAINT concepts_valid CHECK (
        concepts ~ '^(?=.{3,50}$)(?! )(?!.*  )(?!.* $)[A-Za-z0-9 ]+$'
    )

   
)

CREATE TABLE public.expenses_systems (
    expense_id bigint NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE ON UPDATE CASCADE,
    system_id bigint NOT NULL REFERENCES public.systems(id) ON DELETE CASCADE ON UPDATE CASCADE,
    PRIMARY KEY(expense_id, system_id)
);

CREATE TABLE public.expenses_tanks (
    expense_id bigint NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE ON UPDATE CASCADE,
    tank_id bigint NOT NULL REFERENCES public.tanks(id) ON DELETE CASCADE ON UPDATE CASCADE,
    PRIMARY KEY(expense_id, tank_id)
);

CREATE TABLE public.expenses_tags (
    expense_id bigint NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE ON UPDATE CASCADE,
     tag varchar(20) NOT NULL,

    -- Solo letras y espacios, no empieza/termina con espacio, no 2 espacios seguidos
    CONSTRAINT tags_valid CHECK (
        tag ~ '^(?=.{1,20}$)(?! )(?!.*  )(?!.* $)[A-Za-z ]+$'
    ),
    PRIMARY KEY(expense_id, tag)
);




CREATE TABLE public.profit(
    id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    "user" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE ON UPDATE CASCADE,
 amount numeric(12,2) NOT NULL CHECK (amount >= 0),          
    extra_amount numeric(12,2)  CHECK (extra_amount >= 0), 
    extra_units varchar(10),                                      
    concepts varchar(50) NOT NULL,                              

    -- CHECK: solo letras en extra_units
    CONSTRAINT extra_units_letters CHECK (extra_units ~ '^[A-Za-z]*$'),

    -- CHECK: si extra_amount > 0, extra_units NO puede ser nulo ni vacío
    CONSTRAINT extra_units_required_if_extra_amount CHECK (
        (extra_amount IS NULL) OR (extra_units IS NOT NULL AND extra_units <> '')
    ),
-- CHECK: concepts entre 3 y 50 caracteres y solo letras, números y espacios
    -- Concepts: 3-50 caracteres, solo letras, números y espacios, no empieza/termina con espacio, no 2 espacios seguidos
    CONSTRAINT concepts_valid CHECK (
        concepts ~ '^(?=.{3,50}$)(?! )(?!.*  )(?!.* $)[A-Za-z0-9 ]+$'
    )

   
)

CREATE TABLE public.profit_systems (
    expense_id bigint NOT NULL REFERENCES public.profit(id) ON DELETE CASCADE ON UPDATE CASCADE,
    system_id bigint NOT NULL REFERENCES public.systems(id) ON DELETE CASCADE ON UPDATE CASCADE,
    PRIMARY KEY(expense_id, system_id)
);

CREATE TABLE public.profit_tanks (
    expense_id bigint NOT NULL REFERENCES public.profit(id) ON DELETE CASCADE ON UPDATE CASCADE,
    tank_id bigint NOT NULL REFERENCES public.tanks(id) ON DELETE CASCADE ON UPDATE CASCADE,
    PRIMARY KEY(expense_id, tank_id)
);

CREATE TABLE public.profit_tags (
    expense_id bigint NOT NULL REFERENCES public.profit(id) ON DELETE CASCADE ON UPDATE CASCADE,
     tag varchar(20) NOT NULL,

    -- Solo letras y espacios, no empieza/termina con espacio, no 2 espacios seguidos
    CONSTRAINT tags_valid CHECK (
        tag ~ '^(?=.{1,20}$)(?! )(?!.*  )(?!.* $)[A-Za-z ]+$'
    ),
    PRIMARY KEY(expense_id, tag)
);



-- que pasa en las bmbas al borrar algo oa ctualizar algo

CREATE TABLE public.drainings (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  tank bigint NOT NULL,
  "user" uuid NOT NULL,
  volume numeric(9,6) CHECK (volume > 0 and volume <= 999.999999) NOT NULL,
  CONSTRAINT drainings_pkey PRIMARY KEY (id),
  CONSTRAINT drainings_tank_fkey FOREIGN KEY (tank) REFERENCES public.tanks(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT drainings_user_fkey FOREIGN KEY (user) REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE
);


CREATE TABLE public.water_clean(

    id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    tank bigint NOT NULL,
    volume numeric(9,6) CHECK (volume > 0 and volume <= 999.999999) NOT NULL,
    "user" uuid NOT NULL,
    CONSTRAINT water_clean_pkey PRIMARY KEY (id),
    CONSTRAINT water_clean_tank_fkey FOREIGN KEY (tank) REFERENCES public.tanks(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT water_clean_user_fkey FOREIGN KEY (user) REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE
)



CREATE TABLE public.pumps (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  name text NOT NULL  CHECK (name ~ '^[A-Za-z0-9][A-Za-z0-9_]{1,28}[A-Za-z0-9]$'::text),
  system bigint NOT NULL,
  origin bigint NOT NULL,
  destination bigint NOT NULL,
  CONSTRAINT pumps_pkey PRIMARY KEY (id),
  CONSTRAINT bombs_system_fkey FOREIGN KEY (system) REFERENCES public.systems(id),
  CONSTRAINT bombs_destination_fkey FOREIGN KEY (destination) REFERENCES public.tanks(id)  ON DELETE SET NULL 
  ON UPDATE CASCADE,
  CONSTRAINT bombs_origin_fkey FOREIGN KEY (origin) REFERENCES public.tanks(id)  ON DELETE SET NULL
  ON UPDATE CASCADE
);

CREATE TABLE public.esp32_pumps (
    id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    esp32 bigint NOT NULL,
    pump bigint NOT NULL,
    gpio integer NOT NULL CHECK (gpio IN (2,4,5,12,13,14,15,18,19,21,22,23,25,26,27,32,33)),
    CONSTRAINT esp32_pumps_pkey PRIMARY KEY (id),
    CONSTRAINT esp32_pumps_esp32_fkey FOREIGN KEY (esp32) REFERENCES public.esp32(id) ON DELETE CASCADE
    ON UPDATE CASCADE,
    CONSTRAINT esp32_pumps_pump_fkey FOREIGN KEY (pump) REFERENCES public.pumps(id) ON DELETE CASCADE
    ON UPDATE CASCADE
    );


CREATE TABLE public.calibrate (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  pump bigint NOT NULL,
  volume numeric(9,6) CHECK (volume > 0 and volume <= 999.999999) NOT NULL,
   "user" uuid NOT NULL,


  CONSTRAINT calibrate_pkey PRIMARY KEY (id),
  CONSTRAINT calibrate_pump_fkey FOREIGN KEY (pump) REFERENCES public.pumps(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT calibrate_user_fkey FOREIGN KEY (user) REFERENCES auth.users(id) ON DELETE CASCADE ON UPDATE CASCADE

);






CREATE TABLE public.ultime_volume_tank (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  tank bigint NOT NULL UNIQUE,
  last_volume numeric(9,6) CHECK (last_volume >= 0 and last_volume <= 999.999999) NOT NULL,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT ultime_volume_tank_pkey PRIMARY KEY (id),
  CONSTRAINT ultime_volume_tank_tank_fkey FOREIGN KEY (tank) REFERENCES public.tanks(id) ON DELETE CASCADE
  ON UPDATE CASCADE
);

-- tbaal ultimov olumne tabla tanque limpio tabla gastos beneficios








CREATE TABLE public.programming_pumps (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  pump bigint NOT NULL,
   volume numeric(9,6) NOT NULL CHECK (volume> 0 and volume <= 999.999999),
    clock time NOT NULL,                  -- Hora del día en que se activa
     days_of_week day_of_week[] NOT NULL
        CHECK (array_length(days_of_week,1) = array_length(ARRAY(SELECT DISTINCT UNNEST(days_of_week)),1)),
    every_n_days integer DEFAULT 0 CHECK (every_n_days BETWEEN 0 AND 30),
  CONSTRAINT programming_pumps_pkey PRIMARY KEY (id),
  CONSTRAINT programming_pumps_pump_fkey FOREIGN KEY (pump) REFERENCES public.pumps(id) ON DELETE CASCADE
  ON UPDATE CASCADE
  -- desd que momento
);

CREATE TABLE public.records_pumps (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  pump bigint NOT NULL,
  --tanque detsino
  --origen
  volume numeric(9,6) CHECK (volume > 0 and volume <= 999.999999) NOT NULL,
  "user" uuid not null,
  CONSTRAINT records_pumps_pkey PRIMARY KEY (id),
  CONSTRAINT records_pumps_pump_fkey FOREIGN KEY (pump) REFERENCES public.pumps(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT records_pumps_user_fkey FOREIGN KEY (user) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE
);


CREATE TABLE public.executions_pumps (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    -- tanque destino
    --tanque origen
    -- volumen
    programming_id BIGINT NOT NULL REFERENCES public.programming_pumps(id) ON DELETE CASCADE on update cascade,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    success BOOLEAN DEFAULT false
);

-- luces


