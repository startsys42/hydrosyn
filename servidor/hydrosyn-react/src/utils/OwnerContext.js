import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { useLocation } from 'react-router-dom';

const OwnerContext = createContext();

export function OwnerProvider({ children, systemId }) {
    const [isOwner, setIsOwner] = useState(null);
    const [loading, setLoading] = useState(true);

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
                .from('systems')
                .select('id')
                .eq('id', systemId)
                .eq('admin', user.id)
                .eq('is_active', true)
                .maybeSingle();

            setIsOwner(!!data);
            setLoading(false);
        };

        if (systemId) checkOwner();
        else setLoading(false);
    }, [systemId]);

    return (
        <OwnerContext.Provider value={{ isOwner, loading }}>
            {children}
        </OwnerContext.Provider>
    );
}

export function useOwnerStatus() {
    return useContext(OwnerContext);
}