import { useState } from 'react';
import { useAdminStatus } from '../utils/AdminContext';
import useTexts from '../utils/UseTexts';
import '../styles/theme.css';
import { Link } from 'react-router-dom';

export default function Sidebar() {
    const { isAdmin, loading } = useAdminStatus();
    const [collapsed, setCollapsed] = useState(false);
    const t = useTexts();

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



            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                <li style={{ padding: '8px 0' }}>
                    <Link to="/profile">{collapsed ? '👤' : t.profile}</Link>
                </li>


                {isAdmin && !collapsed && (
                    <>
                        <li style={{ padding: '8px 0' }}>
                            <Link to="/users">{collapsed ? '👥' : t.users}</Link>
                        </li>
                        <li style={{ padding: '8px 0' }}>
                            <Link to="/notifications">{collapsed ? '🔔' : t.notifications}</Link>
                        </li>
                    </>
                )}
            </ul>
        </aside>
    );
}