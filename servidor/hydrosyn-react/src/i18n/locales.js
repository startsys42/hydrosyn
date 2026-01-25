import { ownerDocument } from "@mui/material";
import { use } from "react";

const texts = {
    es: {
        system: 'Sistema',

        dark: 'Modo oscuro',
        light: 'Modo claro',
        adminManage: 'Gestión de administradores',


        profile: 'Perfil de usuario',

        systems: 'Sistemas',
        notifications: 'Notificaciones',
        guide: 'Información',
        logout: 'Cerrar sesión',

        verify: 'Verificando...',
        createAdmin: 'Crear administrador',
        activateDeleteAdmin: 'Activar/Eliminar administrador',
        username: 'Usuario',

        usersManage: 'Gestión de usuarios',



        recoverySent: 'Nueva contraseña enviada al correo',

        security: 'Seguridad',

        configuration: 'Configuración',
        fa: 'Autenticación de dos factores',
        code2fa: 'Ingresa tu código 2FA',

        welcome: 'Bienvenido a Hydrosyn',



        changePassword: 'Cambiar contraseña',
        changeEmail: 'Cambiar email',
        password: 'Contraseña',
        login: 'Iniciar sesión',
        email: 'Email',
        backToLogin: 'Volver al inicio de sesión',
        recoverPassword: 'Recuperar contraseña',

        createUser: 'Crear usuario',
        activateUser: 'Activar usuario',
        activateDeleteUser: 'Activar/Eliminar usuario',
        messageCreateUser: 'Usuario creado',
        messageRecover: 'Hemos enviado un enlace de recuperación a tu correo electrónico',
        sendRecoveryLink: 'Enviar enlace de recuperación',
        invalidLink: 'Enlace inválido',
        actualPassword: 'Contraseña actual',
        newPassword: 'Nueva contraseña',

        sending: 'Enviando...',
        changing: 'Cambiando...',
        creating: 'Creando...',
        active: 'Activo',
        messageEmail: 'Revisa el nuevo email para confirmar el cambio',
        messagePassword: '¡Contraseña cambiada con éxito!',
        noEquals: 'No coinciden',

        newSystem: 'Nuevo sistema',
        deleteUser: 'Eliminar usuario',
        nameSystem: 'Nombre del sistema',
        limitSystems: 'No puedes crear más de 2 sistemas.',
        repeatNameSystem: 'Ya existe un sistema con ese nombre.',
        regexNameSystem: 'Nombre inválido. Solo letras, números, guiones bajos y espacios permitidos, máximo 30 caracteres.',
        usersOptions: 'Opciones de usuario',
        codeESP: 'Código ESP32',
        regexCodeESP: 'Código inválido. Solo letras y números permitidos, entre 10 y 30 caracteres.',
        repeatSecretSystem: 'Ya existe un sistema con ese código.',
        userInactive: "Usuario inactivo.",
        deleteSystem: 'Eliminar sistema',
        messageDeleteSystem: '¿Está seguro que desea borrar este sistema? Esta acción no se puede deshacer y borrará todos los datos asociados.',
        renameSystem: 'Renombrar sistema',
        changeSecret: 'Cambiar secreto',
        currentSecret: 'Secreto actual',
        show: 'Mostrar',
        hide: 'Ocultar',
        rename: 'Renombrar',
        renaming: 'Renombrando...',
        delete: 'Eliminar',
        newSecret: 'Nuevo secreto',
        messageChangeSecret: '¿Está seguro que desea cambiar el secreto?',
        dateTime: "Fecha y hora",
        date: "Fecha",
        reason: "Razón",
        owner: "Propietario",
        enter: "Entrar al sistema",
        newName: "Nuevo nombre",
        newEmail: "Nuevo email",
        users: "Usuarios",
        loginDisabled: "Inicio de sesión deshabilitado",
        recoveryDisabled: "Recuperación deshabilitada",
        userNotExists: "El usuario no existe",
        invalidPassword: "Contraseña inválida. Debe tener al menos 10 caracteres, incluir al menos 3 letras distintas y 2 números, y no contener caracteres especiales.",
        options: "Elige una opción:",
        confirmation: "Confirmación",
        no: "No",
        yes: "Sí",
        activateUserQuestion: "¿Está seguro que desea activar al usuario",
        deactivateUserQuestion: "¿Está seguro que desea desactivar al usuario",
        deleteUserQuestion: "¿Está seguro que desea eliminar al usuario",
        deleteUserAllSystemsQuestion: "¿Está seguro que desea eliminar  de todos los sistemas al usuario",
        actionIrreversible: "Esta acción no se puede deshacer y se borrarán los datos y componentes asociados.",

        deleteAllSystems: "Eliminar de todos los sistemas",
        deleteThisSystem: "Eliminar en este sistema",
        deactiveAllSystems: "Desactivar en todos los sistemas",
        deactivate: "Desactivar",
        deactivateUserThisSystemQuestion: "¿Está seguro que desea desactivar en este sistema al usuario",
        activateUserThisSystemQuestion: "¿Está seguro que desea activar en este sistema al usuario",
        deactivateUserAllSystemsQuestion: "¿Está seguro que desea desactivar en todos los sistemas al usuario",
        associateUserQuestion: "¿Está seguro que desea asociar al usuario",
        associate: "Asociar",
        limitUsers: "No puedes asociar más de 5 usuarios por sistema.",

        selectTankType: "Selecciona el tipo de tanque",

        water: "Agua",
        rotifers: "Rotíferos",
        copepods: "Copépodos",
        artemias: "Artemias",
        microalga: "Microalga",
        nutrients: "Nutrientes",



        esp32: 'ESP32',
        addESP32: 'Añadir ESP32',
        removeESP32: 'Eliminar ESP32',
        renameESP32: 'Renombrar ESP32',
        nameESP32: 'Nombre del ESP32',
        selectESP32: 'Selecciona ESP32 a renombrar',
        limitESP32: 'No puedes crear más de 2 ESP32 por sistema.',
        regexNameESP32: 'Nombre inválido. Solo letras, números, guiones bajos, mínimo 3 caracteres y máximo 30.',
        repeatNameESP32: 'Ya existe un ESP32 con ese nombre.',
        deleteESP32Question: "¿Está seguro que desea eliminar el ESP32",

        regexSecretSystem: "Secreto inválido. El secreto debe tener entre 10 y 30 caracteres alfanuméricos.",
        repeatSecretSystem: 'Ya existe un sistema con ese secreto.',
        repeatNameSystem: 'Ya existe un sistema con ese nombre.',
        regexNameSystem: 'Nombre inválido. Solo letras, números, guiones bajos y espacios permitidos (no al principio ni al final), mínimo 3 caracteres y máximo 30.',

        tanks: 'Tanques',
        addTank: 'Añadir tanque',
        removeTank: 'Eliminar tanque',
        renameTank: 'Renombrar tanque',
        nameTank: 'Nombre del tanque',
        selectTank: 'Selecciona tanque a renombrar',

        limitTanks: 'No puedes crear más de 20 Tanques por sistema.',
        regexNameTanks: 'Nombre inválido. Solo letras, números, guiones bajos, mínimo 3 caracteres y máximo 30.',
        repeatNameTanks: 'Ya existe un tanque con ese nombre.',
        deleteTankQuestion: "¿Está seguro que desea eliminar el tanque",

        messageDeleteSystem: '¿Está seguro que desea eliminar este sistema? Esta acción no se puede deshacer y eliminará todos los datos y componentes asociados.',

        pumps: 'Bombas peristálticas',
        addPump: 'Añadir Bomba',
        removePump: 'Eliminar Bomba',
        lights: 'Luces',
        addLight: 'Añadir Luz',
        removeLight: 'Eliminar Luz',

        calendar: 'Calendario',
        expenses: 'Gastos',
        profits: 'Ingresos',
        export: 'Exportar datos',
        removeData: 'Eliminar datos',
        fromDate: 'Desde fecha',
        toDate: 'Hasta fecha',

        viewCalendar: 'Ver Calendario',
        manualRecords: 'Registros manuales',
        viewManualRecords: 'Ver Registros Manuales',
        systemSettings: 'Configuración del sistema',

        manualContent: ' Los administradores no pueden crear mas de cinco usuarios entre todos sus sistemas, el numero de tanques esta limitado y el nuemrod e esp32 a , la informacions e borrar , correo de contacto.  Futuras mejoras',

        passwordRegex: 'La contraseña debe tener al menos 10 caracteres, incluir al menos 3 letras distintas y 2 números, y no contener caracteres especiales.',
        passwordInvalid: 'Contraseña inválida. Solo se permiten letras y números.',
        emailChanged: '¡Correo electrónico cambiado con éxito!',


    },
    en: {
        system: 'System',

        dark: 'Dark mode',
        light: 'Light mode',
        adminManage: 'Admin management',

        profile: 'User profile',
        systems: 'Systems',
        notifications: 'Notifications',
        guide: 'Information',

        logout: 'Logout',
        verify: 'Verifying...',
        createAdmin: 'Create admin',
        activateDeleteAdmin: 'Activate/Delete admin',



        username: 'Username',



        recoverySent: 'New password sent to email',
        security: 'Security',

        configuration: 'Configuration',
        fa: 'Two-Factor Authentication',
        code2fa: 'Enter your 2FA code',

        usersManage: 'User management',
        welcome: 'Welcome to Hydrosyn',




        changePassword: 'Change password',
        changeEmail: 'Change email',
        password: 'Password',
        login: 'Login',
        email: 'Email',
        backToLogin: 'Back to login',
        recoverPassword: 'Recover password',

        createUser: 'Create user',
        activateUser: 'Activate user',
        activateDeleteUser: 'Activate/Delete user',
        messageCreateUser: 'User created',
        messageRecover: 'We have sent a recovery link to your email address',
        sendRecoveryLink: 'Send recovery link',
        invalidLink: 'Invalid link',
        actualPassword: 'Current password',
        newPassword: 'New password',

        sending: 'Sending...',
        changing: 'Changing...',
        creating: 'Creating...',
        active: 'Active',
        messageEmail: 'Check your new email to confirm the change',
        messagePassword: 'Password changed successfully',
        noEquals: 'Do not match',

        newSystem: 'New system',
        deleteUser: 'Delete user',
        nameSystem: 'System name',
        limitSystems: 'You can not create more than 2 systems.',
        repeatNameSystem: 'A system with that name already exists.',
        regexNameSystem: 'Invalid name. Only letters, numbers, underscores, and spaces allowed, maximum 30 characters.',
        usersOptions: 'User options',
        codeESP: 'ESP32 code',
        regexCodeESP: 'Invalid code. Only letters and numbers allowed, between 10 and 30 characters.',
        repeatSecretSystem: 'A system with that code already exists.',
        userInactive: "User is inactive.",
        deleteSystem: 'Delete system',
        messageDeleteSystem: 'Are you sure you want to delete this system? This action can not be undone and will delete all associated data.',
        renameSystem: 'Rename system',
        changeSecret: 'Change secret',
        currentSecret: 'Current secret',
        show: 'Show',
        hide: 'Hide',
        rename: 'Rename',
        renaming: 'Renaming...',
        delete: 'Delete',
        newSecret: 'New secret',
        messageChangeSecret: 'Are you sure you want to change the secret?',
        dateTime: "Date and time",
        date: "Date",
        reason: "Reason",
        owner: "Owner",
        enter: "Go to system",
        newName: "New name",
        newEmail: "New email",
        users: "Users",
        loginDisabled: "Login disabled",
        recoveryDisabled: "Recovery disabled",
        userNotExists: "User does not exist",
        invalidPassword: "Invalid password. It must be at least 10 characters long, include at least 3 different letters and 2 numbers, and not contain special characters.",
        options: "Choose an option:",
        confirmation: "Confirmation",
        no: "No",
        yes: "Yes",
        activateUserQuestion: "Are you sure you want to activate the user",
        deactivateUserQuestion: "Are you sure you want to deactivate the user",
        deleteUserQuestion: "Are you sure you want to delete the user",
        deleteUserAllSystemsQuestion: "Are you sure you want to delete  from all systems the user",
        actionIrreversible: "This action can not be undone and associated data and components will be removed.",

        deleteAllSystems: "Delete from all systems",
        deleteThisSystem: "Delete in this system",
        deactiveAllSystems: "Deactivate in all systems",
        deactivate: "Deactivate",
        deactivateUserThisSystemQuestion: "Are you sure you want to deactivate in this system the user",
        activateUserThisSystemQuestion: "Are you sure you want to activate in this system the user",
        deactivateUserAllSystemsQuestion: "Are you sure you want to deactivate in all systems the user",
        associateUserQuestion: "Are you sure you want to associate the user",
        associate: "Associate",
        limitUsers: "You can not associate more than 5 users per system.",

        selectTankType: "Select tank type",
        water: "Water",
        rotifers: "Rotifers",
        copepods: "Copepods",
        artemias: "Artemias",
        microalga: "Microalga",
        nutrients: "Nutrients",


        esp32: 'ESP32',
        addESP32: 'Add ESP32',
        removeESP32: 'Remove ESP32',
        renameESP32: 'Rename ESP32',
        nameESP32: 'ESP32 name',
        selectESP32: 'Select ESP32 to rename',
        limitESP32: 'You can not create more than 2 ESP32 per system.',
        regexNameESP32: 'Invalid name. Only letters, numbers, underscores, minimum 3 characters and maximum 30.',
        repeatNameESP32: 'An ESP32 with that name already exists.',
        deleteESP32Question: "Are you sure you want to delete the ESP32",

        regexSecretSystem: "Invalid secret. Secret must be 10-30 alphanumeric characters.",
        repeatSecretSystem: 'A system with that secret already exists.',
        repeatNameSystem: 'A system with that name already exists.',
        regexNameSystem: 'Invalid name. Only letters, numbers, underscores and spaces allowed (not at the beginning or end), minimum 3 characters and maximum 30.',


        tanks: 'Tanks',
        addTank: 'Add tank',
        removeTank: 'Remove tank',
        renameTank: 'Rename tank',
        nameTank: 'Tank name',
        selectTank: 'Select tank to rename',

        limitTanks: 'You can not create more than 20 Tanks per system.',
        regexNameTanks: 'Invalid name. Only letters, numbers, underscores, minimum 3 characters and maximum 30.',
        repeatNameTanks: 'A tank with that name already exists.',
        deleteTankQuestion: "Are you sure you want to delete the tank",

        messageDeleteSystem: 'Are you sure you want to delete this system? This action can not be undone and will delete all associated data.',

        pumps: 'Peristaltic Pumps',
        addPump: 'Add Pump',
        removePump: 'Remove Pump',
        lights: 'Lights',
        addLight: 'Add Light',
        removeLight: 'Remove Light',


        calendar: 'Calendar',
        viewCalendar: 'View Calendar',
        manualRecords: 'Manual Records',
        viewManualRecords: 'View Manual Records',
        systemSettings: 'System Settings',
        expenses: 'Expenses',
        profits: 'Profits',
        export: 'Export data',
        removeData: 'Remove data',
        fromDate: 'From Date',
        toDate: 'To Date',



        manualContent: ' Los administradores no pueden crear mas de cinco usuarios entre todos sus sistemas, el numero de tanques esta limitado y el nuemrod e esp32 a , la informacions e borrar , correo de contacto.  Futuras mejoras',

        passwordRegex: 'The password must be at least 10 characters long, include at least 3 different letters and 2 numbers, and not contain special characters.',
        passwordInvalid: 'Invalid password. Only letters and numbers are allowed.',
        emailChanged: 'Email changed successfully!',


    }
}
export default texts;

