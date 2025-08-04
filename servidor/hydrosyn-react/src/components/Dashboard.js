import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import useTexts from '../utils/UseTexts';
import '../styles/theme.css';

export default function Dashboard() {
    const t = useTexts();
    const [userEmail, setUserEmail] = useState('');

    useEffect(() => {
        const fetchUser = async () => {
            const {
                data: { user },
                error,
            } = await supabase.auth.getUser();

            if (user) {
                setUserEmail(user.email);
            } else {
                console.error('No se pudo obtener el usuario', error);
            }
        };

        fetchUser();
    }, []);

    return (
        <div className='div-main-login'>
            <h1>{t.welcome}</h1>
        </div>
    );
}