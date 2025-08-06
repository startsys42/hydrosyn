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
                .order('time', { ascending: false });

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
            <h1>{texts.notifications}</h1>

            {loading ? (
                <p></p>
            ) : notifications.length === 0 ? (
                <p></p>
            ) : (
                <ul className="notifications-list">
                    {notifications.map((notif) => (
                        <li key={notif.id} className="notification-item">
                            <strong>{notif.reason}</strong>
                            <p>{notif.read}</p>
                            <small>{new Date(notif.time).toLocaleString()}</small>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default Notifications;