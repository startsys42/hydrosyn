import { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import texts from '../i18n/locales';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faTimes } from '@fortawesome/free-solid-svg-icons';

const Sidebar = ({ userHasAdvancedAccess }) => {  // true/false
    const [isCollapsed, setIsCollapsed] = useState(false);
    const location = useLocation();
    const menuItems = [
        { id: 'users', path: '/users', requiresAdvanced: true },
        { id: 'profile', path: '/profile', requiresAdvanced: false },
        { id: 'security', path: '/security', requiresAdvanced: true },
        { id: 'notifications', path: '/notifications', requiresAdvanced: true },
        { id: 'configuration', path: '/configuration', requiresAdvanced: true },
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
                style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '24px',
                    cursor: 'pointer',
                    margin: '10px',
                }}
            >
                <FontAwesomeIcon icon={isCollapsed ? faBars : faTimes} />
            </button>

            <ul>
                {filteredItems.map((item) => (
                    <li
                        key={item.path}
                        className={location.pathname === item.path ? 'active' : ''}
                    >
                        <Link to={item.path}>
                            <span className="icon">{item.icon}</span>
                            {!isCollapsed && (
                                <span className="title">{texts[language][item.id]}</span>
                            )}
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Sidebar;
