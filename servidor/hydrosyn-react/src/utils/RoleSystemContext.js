import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { useLocation } from 'react-router-dom';

const RoleSystemContext = createContext();

export function RoleSystemProvider({ children, systemId }) {
    const [role, setRole] = useState("loading"); // "owner" | "member" | "none" | "loading"
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkRole = async () => {
            setLoading(true);

            const {
                data: { user },
                error: authError,
            } = await supabase.auth.getUser();

            if (authError || !user) {
                setRole("none");
                setLoading(false);
                return;
            }

            const { data: ownerData, error: ownerErr } = await supabase
                .from("systems")
                .select(`
        admin_users!inner(
            id,
            user,
            is_active
        )
    `)
                .eq("id", systemId)
                .eq("admin_users.user", user.id)
                .eq("admin_users.is_active", true)
                .maybeSingle();

            if (ownerData && !ownerErr) {
                setRole("owner");
                setLoading(false);
                return;
            }


            const { data: memberData, error: memberErr } = await supabase
                .from("systems_users")
                .select("id")
                .eq("user_id", user.id)
                .eq("system", systemId)
                .eq("is_active", true)
                .maybeSingle();

            if (memberData && !memberErr) {
                setRole("member");
            } else {
                setRole("none");
            }

            setLoading(false);
        };

        if (systemId) {
            checkRole();
        } else {
            setRole("none");
            setLoading(false);
        }
    }, [systemId]);

    return (
        <RoleSystemContext.Provider value={{ role, loading }}>
            {children}
        </RoleSystemContext.Provider>
    );
}

export function useRoleSystem() {
    return useContext(RoleSystemContext);
}