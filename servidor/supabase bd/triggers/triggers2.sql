

CREATE OR REPLACE FUNCTION check_expense_user_admin()
RETURNS trigger AS $$
DECLARE
    is_admin boolean;
BEGIN
    SELECT TRUE INTO is_admin
    FROM public.admin_users
    WHERE "user" = NEW."user" AND is_active = TRUE;

    IF NOT is_admin THEN
        RAISE EXCEPTION 'User must be an active admin';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_check_expense_user
BEFORE INSERT OR UPDATE ON public.expenses
FOR EACH ROW
EXECUTE FUNCTION check_expense_user_admin();

CREATE OR REPLACE FUNCTION check_expense_system_admin()
RETURNS trigger AS $$
DECLARE
    is_valid boolean;
BEGIN
    SELECT TRUE INTO is_valid
    FROM public.expenses e
    JOIN public.admin_users a ON a."user" = e."user"
    JOIN public.systems s ON s.id = NEW.system_id
    WHERE e.id = NEW.expense_id
      AND a.is_active = TRUE
      AND s.admin = e."user";

    IF NOT is_valid THEN
        RAISE EXCEPTION 'User is not admin of this system';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_check_expense_system
BEFORE INSERT OR UPDATE ON public.expenses_systems
FOR EACH ROW
EXECUTE FUNCTION check_expense_system_admin();


CREATE OR REPLACE FUNCTION check_expense_tank_admin()
RETURNS trigger AS $$
DECLARE
    is_valid boolean;
BEGIN
    SELECT TRUE INTO is_valid
    FROM public.expenses e
    JOIN public.admin_users a ON a."user" = e."user"
    JOIN public.tanks t ON t.id = NEW.tank_id
    JOIN public.systems s ON s.id = t.system
    WHERE e.id = NEW.expense_id
      AND a.is_active = TRUE
      AND s.admin = e."user";

    IF NOT is_valid THEN
        RAISE EXCEPTION 'User is not admin of the system owning this tank';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_check_expense_tank
BEFORE INSERT OR UPDATE ON public.expenses_tanks
FOR EACH ROW
EXECUTE FUNCTION check_expense_tank_admin();


CREATE OR REPLACE FUNCTION check_profit_user_admin()
RETURNS trigger AS $$
DECLARE
    is_admin boolean;
BEGIN
    SELECT TRUE INTO is_admin
    FROM public.admin_users
    WHERE "user" = NEW."user" AND is_active = TRUE;

    IF NOT is_admin THEN
        RAISE EXCEPTION 'User must be an active admin';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_check_profit_user
BEFORE INSERT OR UPDATE ON public.profit
FOR EACH ROW
EXECUTE FUNCTION check_profit_user_admin();


CREATE OR REPLACE FUNCTION check_profit_system_admin()
RETURNS trigger AS $$
DECLARE
    is_valid boolean;
BEGIN
    SELECT TRUE INTO is_valid
    FROM public.profit p
    JOIN public.admin_users a ON a."user" = p."user"
    JOIN public.systems s ON s.id = NEW.system_id
    WHERE p.id = NEW.profit_id
      AND a.is_active = TRUE
      AND s.admin = p."user";

    IF NOT is_valid THEN
        RAISE EXCEPTION 'User is not admin of this system';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_check_profit_system
BEFORE INSERT OR UPDATE ON public.profit_systems
FOR EACH ROW
EXECUTE FUNCTION check_profit_system_admin();


CREATE OR REPLACE FUNCTION check_profit_tank_admin()
RETURNS trigger AS $$
DECLARE
    is_valid boolean;
BEGIN
    SELECT TRUE INTO is_valid
    FROM public.profit p
    JOIN public.admin_users a ON a."user" = p."user"
    JOIN public.tanks t ON t.id = NEW.tank_id
    JOIN public.systems s ON s.id = t.system
    WHERE p.id = NEW.profit_id
      AND a.is_active = TRUE
      AND s.admin = p."user";

    IF NOT is_valid THEN
        RAISE EXCEPTION 'User is not admin of the system owning this tank';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_check_profit_tank
BEFORE INSERT OR UPDATE ON public.profit_tanks
FOR EACH ROW
EXECUTE FUNCTION check_profit_tank_admin();
