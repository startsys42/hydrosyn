import { useState } from 'react';
import { useAdminStatus } from '../utils/AdminContext';
import useTexts from '../utils/UseTexts';
import '../styles/theme.css';

export default function Sidebar() {
    const { isAdmin, loading } = useAdminStatus();
    const [collapsed, setCollapsed] = useState(false);

    if (loading) return <aside></aside>;

    return (
        <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
            <button
                onClick={() => setCollapsed(!collapsed)}
                style={{
                    marginBottom: 20,
                    padding: '5px 10px',
                    cursor: 'pointer',
                }}
                aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
            >
                {collapsed ? '➡️' : '⬅️'}
            </button>

            <h3 style={{ display: collapsed ? 'none' : 'block' }}>Menú</h3>

            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                <li title="Perfil" style={{ padding: '8px 0' }}>
                    {collapsed ? '👤' : 'Perfil'}
                </li>
                <li title="Usuarios" style={{ padding: '8px 0' }}>
                    {collapsed ? '👥' : 'Usuarios'}
                </li>
                <li title="Notificaciones" style={{ padding: '8px 0' }}>
                    {collapsed ? '🔔' : 'Notificaciones'}
                </li>

                {isAdmin && !collapsed && (
                    <>
                        <li style={{ padding: '8px 0', fontWeight: 'bold' }}>
                            Administración
                        </li>
                        <li title="Administrar Usuarios" style={{ padding: '8px 0' }}>
                            Administrar Usuarios
                        </li>
                        <li title="Configuración" style={{ padding: '8px 0' }}>
                            Configuración
                        </li>
                    </>
                )}
            </ul>
        </aside>
    );
}