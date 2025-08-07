import '../styles/theme.css';
import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import useTexts from '../utils/UseTexts';

function Notifications() {


    const texts = useTexts();


    const [attempts, setAttempts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchLoginAttempts = async () => {
            try {
                setLoading(true);
                // Llama a la función de base de datos que creaste
                const { data, error } = await supabase.rpc('get_login_attempts_with_user_email');

                if (error) {
                    throw error;
                }

                setAttempts(data);
            } catch (e) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        };

        fetchLoginAttempts();
    }, []);


    return (
        <div className='div-main-login'>
            <h1>{texts.notifications}</h1>

            {loading ? (
                <p></p>
            ) : attempts.length === 0 ? (
                <p></p>
            ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr>
                            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Email</th>
                            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Razón</th>
                            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Fecha y Hora</th>
                        </tr>
                    </thead>
                    <tbody>
                        {attempts.map((attempt, index) => (
                            <tr key={index}>
                                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{attempt.user_email}</td>
                                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{attempt.reason}</td>
                                <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                                    {/* Aquí formateamos la fecha para que sea más legible */}
                                    {new Date(attempt.created_at).toLocaleString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default Notifications;