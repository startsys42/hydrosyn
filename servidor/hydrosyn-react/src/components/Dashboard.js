import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';

export default function Dashboard() {
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
            <h1>Bienvenido al Dashboard</h1>
            {userEmail && <p>Sesión iniciada como: {userEmail}</p>}
        </div>
    );
}