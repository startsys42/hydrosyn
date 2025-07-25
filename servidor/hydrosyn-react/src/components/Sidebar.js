import { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import texts from '../i18n/locales';


const Sidebar = ({ userHasAdvancedAccess }) => {  // true/false
    const [isCollapsed, setIsCollapsed] = useState(false);
    const location = useLocation();

    // Items del menú
    const menuItems = [
        {
            title: 'Dashboard',

            path: '/dashboard',
            requiresAdvanced: false, // Siempre visible
        },
        {
            title: 'Usuarios',

            path: '/users',
            requiresAdvanced: true, // Solo visible con permiso
        },
        {
            title: 'Configuración',

            path: '/settings',
            requiresAdvanced: false, // Siempre visible
        },
    ];

    // Filtra items
    const filteredItems = menuItems.filter(item =>
        !item.requiresAdvanced || (item.requiresAdvanced && userHasAdvancedAccess)
    );

    return (
        <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="menu-toggle"
            >
                {isCollapsed ? '🍔' : '✖'}
            </button>

            <ul>
                {filteredItems.map((item) => (
                    <li
                        key={item.path}
                        className={location.pathname === item.path ? 'active' : ''}
                    >
                        <Link to={item.path}>
                            <span className="icon">{item.icon}</span>
                            {!isCollapsed && <span className="title">{item.title}</span>}
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
};