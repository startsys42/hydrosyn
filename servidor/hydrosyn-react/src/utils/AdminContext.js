import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

const AdminContext = createContext();

export function AdminProvider({ children }) {
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAdmin = async () => {
            const {
                data: { user },
                error: authError,
            } = await supabase.auth.getUser();

            if (authError || !user) {
                console.error('Error obteniendo usuario:', authError);
                setLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from('roles')
                .select('id')
                .eq('user_id', user.id)
                .single();

            setIsAdmin(!error && data); // Si hay dato, es admin
            setLoading(false);
        };

        checkAdmin();
    }, []);

    return (
        <AdminContext.Provider value={{ isAdmin, loading }}>
            {children}
        </AdminContext.Provider>
    );
}

export function useAdminStatus() {
    return useContext(AdminContext);
}
