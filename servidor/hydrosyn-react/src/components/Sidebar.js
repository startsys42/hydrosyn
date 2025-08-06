import { useState } from 'react';
import { useAdminStatus } from '../utils/AdminContext';
import useTexts from '../utils/UseTexts';
import '../styles/theme.css';
import { Link } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function Sidebar() {
    const { isAdmin, loading } = useAdminStatus();
    const [collapsed, setCollapsed] = useState(false);
    const t = useTexts();
    const navigate = useNavigate();
    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            alert('Error al cerrar sesión: ' + error.message);
            return;
        }
        navigate('/'); // redirige a login tras cerrar sesión
    };

    if (loading || isAdmin === null) return null;

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



            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                <li style={{ padding: '8px 0' }}>
                    <Link className="custom-link" to="/profile">{collapsed ? '👤' : t.profile}</Link>
                </li>


                {isAdmin && (
                    <>
                        <li style={{ padding: '8px 0' }}>
                            <Link className="custom-link" to="/users">{collapsed ? '👥' : t.users}</Link>
                        </li>
                        <li style={{ padding: '8px 0' }}>
                            <Link className="custom-link" to="/notifications">{collapsed ? '🔔' : t.notifications}</Link>
                        </li>
                    </>
                )}

                <li style={{ padding: '8px 0' }}>
                    <button
                        onClick={handleLogout}
                        style={{
                            textAlign: 'center',
                            padding: '10px',
                            boxSizing: 'border-box',
                            cursor: 'pointer',

                            font: 'inherit',

                            width: '100%',
                        }}

                    >
                        {collapsed ? '🚪' : t.logout}
                    </button>
                </li>
            </ul>
        </aside >
    );
}