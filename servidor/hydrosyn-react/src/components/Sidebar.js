import { useState } from 'react';
import { useAdminStatus } from '../utils/AdminContext';
import useTexts from '../utils/UseTexts';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';


import {
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    IconButton,
    Divider,
    Box
} from '@mui/material';


import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import LogoutIcon from '@mui/icons-material/Logout';
import NotificationsIcon from '@mui/icons-material/Notifications';
import GroupIcon from '@mui/icons-material/Group';
import PersonIcon from '@mui/icons-material/Person';
import ScienceIcon from '@mui/icons-material/Science';

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
        navigate('/');
    };

    if (loading || isAdmin === null) return null;


    const drawerWidth = 210;
    const collapsedWidth = 65;

    return (
        <Drawer
            variant="permanent"
            sx={{
                width: collapsed ? collapsedWidth : drawerWidth,
                flexShrink: 0,
                whiteSpace: 'nowrap',

                '& .MuiDrawer-paper': {
                    width: collapsed ? collapsedWidth : drawerWidth,
                    transition: 'width 0.3s ease',
                    overflowX: 'hidden',
                    backgroundColor: 'background.paper',
                },
            }}
        >

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-end', p: 1 }}>
                <IconButton onClick={() => setCollapsed(!collapsed)}>
                    {collapsed ? <ArrowForwardIcon /> : <ArrowBackIcon />}
                </IconButton>
            </Box>

            <Divider />


            <List>

                <ListItem disablePadding>

                    <ListItemButton component={Link} to="/profile">
                        <ListItemIcon sx={{ minWidth: 40, justifyContent: 'center' }}>
                            <PersonIcon color="primary" />
                        </ListItemIcon>
                        {!collapsed && <ListItemText primary={t.profile} />}
                    </ListItemButton>
                </ListItem>


                <ListItem disablePadding>
                    <ListItemButton component={Link} to="/dashboard">
                        <ListItemIcon sx={{ minWidth: 40, justifyContent: 'center' }}>
                            <ScienceIcon color="primary" />
                        </ListItemIcon>
                        {!collapsed && <ListItemText primary={t.systems} />}
                    </ListItemButton>
                </ListItem>


                {isAdmin && (
                    <>
                        <ListItem disablePadding>
                            <ListItemButton component={Link} to="/users-admin">
                                <ListItemIcon sx={{ minWidth: 40, justifyContent: 'center' }}>
                                    <GroupIcon color="primary" />
                                </ListItemIcon>
                                {!collapsed && <ListItemText primary={t.adminManage} />}
                            </ListItemButton>
                        </ListItem>

                        <ListItem disablePadding>
                            <ListItemButton component={Link} to="/notifications-admin">
                                <ListItemIcon sx={{ minWidth: 40, justifyContent: 'center' }}>
                                    <NotificationsIcon color="primary" />
                                </ListItemIcon>
                                {!collapsed && <ListItemText primary={t.notifications} />}
                            </ListItemButton>
                        </ListItem>
                    </>
                )}
            </List>


            <Box sx={{ flexGrow: 1 }} />
            <Divider />

            <List>
                <ListItem disablePadding>
                    <ListItemButton onClick={handleLogout}>
                        <ListItemIcon sx={{ minWidth: 40, justifyContent: 'center' }}>
                            <LogoutIcon color="error" />
                        </ListItemIcon>
                        {!collapsed && <ListItemText primary={t.logout} sx={{ color: 'error.main' }} />}
                    </ListItemButton>
                </ListItem>
            </List>
        </Drawer>
    );
}



/*

import { useState } from 'react';
import { useAdminStatus } from '../utils/AdminContext';
import useTexts from '../utils/UseTexts';

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
        navigate('/');
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

*/