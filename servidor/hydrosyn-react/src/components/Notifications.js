import '../styles/theme.css';
import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import useTexts from '../utils/UseTexts';

function Notifications() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const texts = useTexts();


    useEffect(() => {
        const fetchNotifications = async () => {
            const { data, error } = await supabase
                .from('notifications') // Asegúrate de tener esta tabla
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching notifications:', error.message);
            } else {
                setNotifications(data);
            }

            setLoading(false);
        };

        fetchNotifications();
    }, []);

    return (
        <div className='div-main-login'>
            <h2>{texts.notifications}</h2>

            {loading ? (
                <p>Cargando...</p>
            ) : notifications.length === 0 ? (
                <p>No hay notificaciones.</p>
            ) : (
                <ul className="notifications-list">
                    {notifications.map((notif) => (
                        <li key={notif.id} className="notification-item">
                            <strong>{notif.title}</strong>
                            <p>{notif.message}</p>
                            <small>{new Date(notif.created_at).toLocaleString()}</small>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default Notifications;