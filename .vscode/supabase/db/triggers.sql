
DROP FUNCTION IF EXISTS public.bloquear_modificaciones_roles CASCADE;
DROP FUNCTION IF EXISTS public.bloquear_operaciones_email_notifications CASCADE;
DROP FUNCTION IF EXISTS public.validar_actualizacion_email_notifications CASCADE;


CREATE OR REPLACE FUNCTION public.bloquear_modificaciones_roles()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Operación no permitida: La tabla public.roles es de solo lectura';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION public.bloquear_operaciones_email_notifications()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Operación no permitida: No se pueden insertar o eliminar registros en public.email_notifications';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION public.validar_actualizacion_email_notifications()
RETURNS TRIGGER AS $$
BEGIN
    
    IF NEW.email IS NOT NULL THEN
        IF length(NEW.email) > 100 THEN
            RAISE EXCEPTION 'El email no puede exceder 100 caracteres';
        END IF;

        IF NEW.email !~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
            RAISE EXCEPTION 'Formato de email inválido (ejemplo: usuario@dominio.com)';
        END IF;
    END IF;

    
    IF NEW.code_2fa IS NOT NULL THEN
        IF NEW.code_2fa !~ '^[a-zA-Z0-9]{6}$' THEN
            RAISE EXCEPTION 'El código 2FA debe tener exactamente 6 caracteres alfanuméricos';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;





DROP TRIGGER IF EXISTS evitar_insert_roles ON public.roles;
DROP TRIGGER IF EXISTS evitar_update_roles ON public.roles;
DROP TRIGGER IF EXISTS evitar_delete_roles ON public.roles;

CREATE TRIGGER evitar_insert_roles
BEFORE INSERT ON public.roles
FOR EACH ROW
EXECUTE FUNCTION public.bloquear_modificaciones_roles();

CREATE TRIGGER evitar_update_roles
BEFORE UPDATE ON public.roles
FOR EACH ROW
EXECUTE FUNCTION public.bloquear_modificaciones_roles();

CREATE TRIGGER evitar_delete_roles
BEFORE DELETE ON public.roles
FOR EACH ROW
EXECUTE FUNCTION public.bloquear_modificaciones_roles();





DROP TRIGGER IF EXISTS evitar_insert_email_notifications ON public.email_notifications;
DROP TRIGGER IF EXISTS evitar_delete_email_notifications ON public.email_notifications;
DROP TRIGGER IF EXISTS validar_update_email_notifications ON public.email_notifications;

CREATE TRIGGER evitar_insert_email_notifications
BEFORE INSERT ON public.email_notifications
FOR EACH ROW
EXECUTE FUNCTION public.bloquear_operaciones_email_notifications();

CREATE TRIGGER evitar_delete_email_notifications
BEFORE DELETE ON public.email_notifications
FOR EACH ROW
EXECUTE FUNCTION public.bloquear_operaciones_email_notifications();

CREATE TRIGGER validar_update_email_notifications
BEFORE UPDATE ON public.email_notifications
FOR EACH ROW
EXECUTE FUNCTION public.validar_actualizacion_email_notifications();


DROP FUNCTION IF EXISTS public.validar_events_read_y_created CASCADE;


CREATE OR REPLACE FUNCTION public.validar_events_read_y_created()
RETURNS TRIGGER AS $$
BEGIN
    
    IF NEW.read_at IS NOT NULL AND NEW.read_at <= NEW.created_at THEN
        RAISE EXCEPTION 'read_at debe ser posterior a created_at';
    END IF;

    
    IF TG_OP = 'UPDATE' AND NEW.created_at <> OLD.created_at THEN
        RAISE EXCEPTION 'El campo created_at no se puede modificar';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


DROP TRIGGER IF EXISTS trigger_validar_events_read_y_created ON public.events;


CREATE TRIGGER trigger_validar_events_read_y_created
BEFORE INSERT OR UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.validar_events_read_y_created();
