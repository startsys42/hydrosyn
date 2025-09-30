import { useNavigate } from 'react-router-dom';
import useTexts from '../../utils/UseTexts';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import '../../styles/theme.css';
import { DataGrid } from '@mui/x-data-grid';
import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { useParams } from 'react-router-dom';
import CreateUserSystem from '../UsersComponents/CreateUserSystem';
import DeleteUserSystem from '../UsersComponents/DeleteUserSystem';
import ActivateUserSystem from '../UsersComponents/ActivateUserSystem';
import AssociateUserSystem from '../UsersComponents/AssociateUserSystem';








export default function UserAccordion({ systemId }) {
    const navigate = useNavigate();
    const texts = useTexts();
    const [users, setUsers] = useState([]);
    const [availableUsers, setAvailableUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [loadingAvailable, setLoadingAvailable] = useState(false);
    const [checkedAdmin, setCheckedAdmin] = useState(false);

    const [errors, setErrors] = useState({
        create: '',
        delete: '',
        activate: '',
        associate: '',
    });

    const setCreateError = (msg) => setErrors({ create: msg, delete: '', activate: '', associate: '' });
    const setDeleteError = (msg) => setErrors({ create: '', delete: msg, activate: '', associate: '' });
    const setActivateError = (msg) => setErrors({ create: '', delete: '', activate: msg, associate: '' });
    const setAssociateError = (msg) => setErrors({ create: '', delete: '', activate: '', associate: msg });

    const fetchAll = async () => {
        setLoading(true);
        const user = await checkAdmin();
        if (!user) return; // ya navegamos si no pasa

        // Llamar ambos fetch en paralelo
        await Promise.all([
            fetchUsers(user),
            fetchAvailableUsers(user)
        ]);

        setCheckedAdmin(true);
        setLoading(false);
    };

    // --- Verificación de admin ---
    const checkAdmin = async () => {
        const { data: { user }, error: authErr } = await supabase.auth.getUser();
        if (authErr || !user) {
            navigate("/dashboard");
            return null;
        }

        const { data: adminData, error: adminErr } = await supabase
            .from('admin_users')
            .select('user, is_active')
            .eq('user', user.id)
            .eq('is_active', true)
            .single();
        if (adminErr || !adminData) {
            navigate("/dashboard");
            return null;
        }

        const { data: systemData, error: systemErr } = await supabase
            .from('systems')
            .select('id, admin')
            .eq('id', systemId)
            .eq('admin', user.id)
            .single();
        if (systemErr || !systemData) {
            navigate("/dashboard");
            return null;
        }

        return user;
    };

    const fetchUsers = async () => {
        setLoadingUsers(true);
        try {
            const user = await checkAdmin();
            if (!user) return;

            const { data, error } = await supabase
                .rpc('get_users_for_system', { p_system: systemId, p_user: user.id });

            if (error) {
                // Si hay error al llamar la RPC, navegamos y cortamos
                navigate("/dashboard");
                return;
            }

            setUsers(
                data.map((u) => ({
                    id: u.su_id,      // ID de systems_users
                    user_id: u.user_id,
                    email: u.email,
                    is_active: u.is_active,
                }))
            );

        } catch (err) {
            setErrors((prev) => ({ ...prev, delete: err.message }));
        } finally {
            setLoadingUsers(false);
        }
    };

    const fetchAvailableUsers = async () => {
        setLoadingAvailable(true);
        try {
            const user = await checkAdmin();
            if (!user) return;
            const { data, error } = await supabase
                .rpc('get_possible_users_for_system', { p_system: systemId, p_user: user.id });

            if (error) {
                // Si hay error al llamar la RPC, navegamos y cortamos
                navigate("/dashboard");
                return;
            }



            setAvailableUsers(
                data.map((u) => ({
                    user_id: u.user_id,
                    email: u.email

                }))
            );
        } catch (err) {
            setErrors((prev) => ({ ...prev, associate: err.message }));
        } finally {
            setLoadingAvailable(false);
        }
    };

    useEffect(() => {
        fetchAll();
    }, [systemId]);


    if (loading || !checkedAdmin) return <p></p>;

    return (
        <>
            <h2>{texts.users}</h2>

            <CreateUserSystem
                systemId={systemId}
                refreshUsers={fetchUsers}
                refreshAvailable={fetchAvailableUsers}
                error={errors.create}
                setError={setCreateError}
                loading={loadingUsers || loadingAvailable} // <-- añadido
            />

            <DeleteUserSystem
                systemId={systemId}
                users={users}
                refreshUsers={fetchUsers}
                refreshAvailable={fetchAvailableUsers}
                error={errors.delete}
                setError={setDeleteError}
                loading={loadingUsers || loadingAvailable} // porque borrado afecta a ambos
            />

            <ActivateUserSystem
                systemId={systemId}
                users={users}
                refreshUsers={fetchUsers}
                error={errors.activate}
                setError={setActivateError}
                loading={loadingUsers} // solo afecta users
            />

            <AssociateUserSystem
                systemId={systemId}
                availableUsers={availableUsers}
                refreshUsers={fetchUsers}
                refreshAvailable={fetchAvailableUsers}
                error={errors.associate}
                setError={setAssociateError}
                loading={loadingUsers || loadingAvailable} // porque asociar afecta a ambos
            />
        </>
    );
}

