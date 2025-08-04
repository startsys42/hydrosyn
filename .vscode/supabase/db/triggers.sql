-- Eliminar funciones si ya existen
DROP FUNCTION IF EXISTS public.bloquear_modificaciones_roles CASCADE;
DROP FUNCTION IF EXISTS public.bloquear_operaciones_email_notifications CASCADE;
DROP FUNCTION IF EXISTS public.validar_actualizacion_email_notifications CASCADE;

-- Función para bloquear INSERT/UPDATE/DELETE en roles (solo lectura)
CREATE OR REPLACE FUNCTION public.bloquear_modificaciones_roles()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Operación no permitida: La tabla public.roles es de solo lectura';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Función para bloquear INSERT/DELETE en email_notifications
CREATE OR REPLACE FUNCTION public.bloquear_operaciones_email_notifications()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Operación no permitida: No se pueden insertar o eliminar registros en public.email_notifications';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Función para validar actualizaciones en email_notifications
CREATE OR REPLACE FUNCTION public.validar_actualizacion_email_notifications()
RETURNS TRIGGER AS $$
BEGIN
    -- Validar email
    IF NEW.email IS NOT NULL THEN
        IF length(NEW.email) > 100 THEN
            RAISE EXCEPTION 'El email no puede exceder 100 caracteres';
        END IF;

        IF NEW.email !~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
            RAISE EXCEPTION 'Formato de email inválido (ejemplo: usuario@dominio.com)';
        END IF;
    END IF;

    -- Validar 2FA
    IF NEW.code_2fa IS NOT NULL THEN
        IF NEW.code_2fa !~ '^[a-zA-Z0-9]{6}$' THEN
            RAISE EXCEPTION 'El código 2FA debe tener exactamente 6 caracteres alfanuméricos';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- Triggers para public.roles (solo lectura)
-- =============================================

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

-- =============================================
-- Triggers para public.email_notifications
-- =============================================

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

-- Crear nueva función
CREATE OR REPLACE FUNCTION public.validar_events_read_y_created()
RETURNS TRIGGER AS $$
BEGIN
    -- 1. Verificar que read_at sea mayor que created_at si read_at no es NULL
    IF NEW.read_at IS NOT NULL AND NEW.read_at <= NEW.created_at THEN
        RAISE EXCEPTION 'read_at debe ser posterior a created_at';
    END IF;

    -- 2. Evitar que created_at sea modificado
    IF TG_OP = 'UPDATE' AND NEW.created_at <> OLD.created_at THEN
        RAISE EXCEPTION 'El campo created_at no se puede modificar';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Eliminar trigger si ya existe
DROP TRIGGER IF EXISTS trigger_validar_events_read_y_created ON public.events;

-- Crear trigger para validar lógica
CREATE TRIGGER trigger_validar_events_read_y_created
BEFORE INSERT OR UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.validar_events_read_y_created();
