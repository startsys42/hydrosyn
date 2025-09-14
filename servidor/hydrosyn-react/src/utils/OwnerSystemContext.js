import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { useLocation } from 'react-router-dom';

const OwnerSystemContext = createContext();

export function OwnerSystemProvider({ children, systemId }) {
    const [isOwnerSystem, setIsOwnerSystem] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkOwnerSystem = async () => {
            const {
                data: { user },
                error: authError,
            } = await supabase.auth.getUser();

            if (authError || !user) {
                setIsOwnerSystem(false);
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

            setIsOwnerSystem(!!data);
            setLoading(false);
        };

        if (systemId) checkOwnerSystem();
        else setLoading(false);
    }, [systemId]);

    return (
        <OwnerSystemContext.Provider value={{ isOwnerSystem, loading }}>
            {children}
        </OwnerSystemContext.Provider>
    );
}

export function useOwnerSystemStatus() {
    return useContext(OwnerSystemContext);
}