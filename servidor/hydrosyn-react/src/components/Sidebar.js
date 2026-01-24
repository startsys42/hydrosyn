import { useState } from 'react';
import { useAdminStatus } from '../utils/AdminContext';
import useTexts from '../utils/UseTexts';
import '../styles/theme.css';
import { Link } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import LogoutIcon from '@mui/icons-material/Logout';
import NotificationsIcon from '@mui/icons-material/Notifications';
import GroupIcon from '@mui/icons-material/Group';
import PersonIcon from '@mui/icons-material/Person';
import ScienceIcon from '@mui/icons-material/Science';
import InfoIcon from '@mui/icons-material/Info';

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
                {collapsed ? <ArrowForwardIcon /> : <ArrowBackIcon />}
            </button>



            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                <li style={{ padding: '8px 0' }}>
                    <Link className="custom-link" to="/profile">{collapsed ? <PersonIcon /> : t.profile}</Link>
                </li>

                <li style={{ padding: '8px 0' }}>
                    <Link className="custom-link" to="/dashboard">{collapsed ? <ScienceIcon /> : t.systems}</Link>
                </li>
                {isAdmin && (
                    <>
                        <li style={{ padding: '8px 0' }}>
                            <Link className="custom-link" to="/users-admin">{collapsed ? <GroupIcon /> : t.adminManage}</Link>
                        </li>
                        <li style={{ padding: '8px 0' }}>
                            <Link className="custom-link" to="/notifications-admin">{collapsed ? <NotificationsIcon /> : t.notifications}</Link>
                        </li>
                    </>
                )}
                <li style={{ padding: '8px 0' }}>
                    <Link className="custom-link" to="/help">{collapsed ? <InfoIcon /> : t.guide}</Link>
                </li>
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
                        {collapsed ? <LogoutIcon /> : t.logout}
                    </button>
                </li>
            </ul>
        </aside >
    );
}