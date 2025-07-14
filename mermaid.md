diagrama


flowchart TD
    A[¿Necesitas control de acceso?] -->|Sí| B[¿Un rol por usuario es suficiente?]
    A -->|No| Z[No necesitas sistema de roles]

    B -->|Sí| C[Crear tabla de usuarios con campo role_id]
    C --> D[Definir tabla roles]
    D --> E[Control de acceso simple: OK ✅]

    B -->|No| F[¿Necesitas permisos específicos por rol?]
    F -->|Sí| G[Crear tabla permissions]
    G --> H[Crear tabla role_permissions (many-to-many)]
    H --> I[Asignar permisos a roles]

    F -->|No| X[Usa roles como banderas lógicas en app]

    I --> J[¿Configuraciones por usuario o rol?]
    J -->|Por rol| K[Tabla config_por_rol]
    J -->|Por usuario| L[Tabla user_config]

    K --> M[Control de configuración listo 🛠️]
    L --> M

    Z --> END[Fin]
    X --> END
    M --> END
