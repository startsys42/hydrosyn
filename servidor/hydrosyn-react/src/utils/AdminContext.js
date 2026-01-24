import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { useLocation } from 'react-router-dom';

const AdminContext = createContext();

export function AdminProvider({ children }) {
    const [isAdmin, setIsAdmin] = useState(null);
    const [loading, setLoading] = useState(true);
    const location = useLocation();

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
                .eq('user', user.id)
                .maybeSingle();

            setIsAdmin(!error && data !== null);

            setLoading(false);
        };

        checkAdmin();
    }, [location.pathname]);

    return (
        <AdminContext.Provider value={{ isAdmin, loading }}>
            {children}
        </AdminContext.Provider>
    );
}

export function useAdminStatus() {
    return useContext(AdminContext);
}
