import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useTexts } from '../utils/UseTexts';

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
        <div>
            <h1>{t.welcome}</h1>
            {userEmail && <p>Sesión iniciada como: {userEmail}</p>}
        </div>
    );
}