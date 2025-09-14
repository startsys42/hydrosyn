import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { useLocation } from 'react-router-dom';

const OwnerContext = createContext();

export function OwnerProvider({ children }) {
    const [isOwner, setIsOwner] = useState(null);
    const [loading, setLoading] = useState(true);
    const location = useLocation();

    useEffect(() => {
        const checkOwner = async () => {
            const {
                data: { user },
                error: authError,
            } = await supabase.auth.getUser();

            if (authError || !user) {
                setIsOwner(false);
                setLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from('admin_users')
                .select('id')

                .eq('user', user.id)
                .eq('is_active', true)
                .maybeSingle();

            setIsOwner(!error && !!data);
            setLoading(false);
        };

        checkOwner();

    }, [location.pathname]);

    return (
        <OwnerContext.Provider value={{ isOwner, loading }}>
            {children}
        </OwnerContext.Provider>
    );
}

export function useOwnerStatus() {
    return useContext(OwnerContext);
}