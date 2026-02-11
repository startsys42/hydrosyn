
CREATE TABLE public.expenses(
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
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

   
);

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
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
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

   
);

CREATE TABLE public.profit_systems (
    profit_id bigint NOT NULL REFERENCES public.profit(id) ON DELETE CASCADE ON UPDATE CASCADE,
    system_id bigint NOT NULL REFERENCES public.systems(id) ON DELETE CASCADE ON UPDATE CASCADE,
    PRIMARY KEY(profit_id, system_id)
);

CREATE TABLE public.profit_tanks (
    profit_id bigint NOT NULL REFERENCES public.profit(id) ON DELETE CASCADE ON UPDATE CASCADE,
    tank_id bigint NOT NULL REFERENCES public.tanks(id) ON DELETE CASCADE ON UPDATE CASCADE,
    PRIMARY KEY(profit_id, tank_id)
);

CREATE TABLE public.profit_tags (
    profit_id bigint NOT NULL REFERENCES public.profit(id) ON DELETE CASCADE ON UPDATE CASCADE,
     tag varchar(20) NOT NULL,

    -- Solo letras y espacios, no empieza/termina con espacio, no 2 espacios seguidos
    CONSTRAINT tags_valid CHECK (
        tag ~ '^(?=.{1,20}$)(?! )(?!.*  )(?!.* $)[A-Za-z ]+$'
    ),
    PRIMARY KEY(profit_id, tag)
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