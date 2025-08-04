import { useAdminStatus } from './AdminContext';

export default function Sidebar() {
    const { isAdmin, loading } = useAdminStatus();

    if (loading) return <aside>Cargando menú...</aside>;

    return (
        <aside style={{ width: 200, padding: 20, background: '#f4f4f4' }}>
            <h3>Menú</h3>
            <ul>
                <li>Inicio</li>
                <li>Perfil</li>

                {isAdmin && (
                    <>
                        <li>Administrar Usuarios</li>
                        <li>Configuración</li>
                    </>
                )}
            </ul>
        </aside>
    );
}