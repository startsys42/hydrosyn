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

// añadir eliminar asociar activar desactivar eliminar de todo los sitemas
export default function UserAccordion({ systemId }) {
    const navigate = useNavigate();
    const texts = useTexts(); // ✅ ya no lo pasamos como prop
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [users, setUsers] = useState([]);


    const deleteColumns = [
        { field: 'email', headerName: 'Email', width: 250 },
        {
            field: 'deleteSystem',
            headerName: 'Borrar de este sistema',
            renderCell: (params) => (
                <button onClick={() => handleDeleteFromSystem(params.row.id)} style={{ color: 'red' }}>
                    Borrar
                </button>
            )
        },
        {
            field: 'deleteAll',
            headerName: 'Borrar de todos los sistemas',
            renderCell: (params) => (
                <button onClick={() => handleDeleteUserCompletely(params.row.id)} style={{ color: 'red' }}>
                    Borrar Todo
                </button>
            )
        }
    ];

    const activateColumns = [
        { field: 'email', headerName: 'Email', width: 250 },
        {
            field: 'active',
            headerName: 'Activo',
            renderCell: (params) => (
                <input
                    type="checkbox"
                    checked={params.row.is_active}
                    onChange={() => handleToggleActive(params.row.id, params.row.is_active)}
                />
            )
        }
    ];

    const associateColumns = [
        { field: 'email', headerName: 'Email', width: 250 },
        {
            field: 'associate',
            headerName: 'Asociar',
            renderCell: (params) => (
                <button onClick={() => handleAssociateUser(params.row.id)}>Asociar</button>
            )
        }
    ];

    const fetchAllUsers = async () => {
        const { data, error } = await supabase.from('admin_users').select('*');
        if (error) setError(error.message);
        else console.log(data); // o setUsers(data)
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setError('');
        try {
            // Crear usuario en supabase
            const { data, error } = await supabase.auth.admin.createUser({
                email,
                password: 'defaultPassword123!' // puedes cambiar la lógica
            });
            if (error) throw error;

            setMessage('Usuario creado correctamente');
            setEmail('');
            await fetchUsers(); // refresca la tabla de usuarios
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteFromSystem = async (userId) => {
        if (!window.confirm('¿Eliminar usuario de este sistema?')) return;
        try {
            await supabase
                .from('systems_users')
                .delete()
                .eq('user_id', userId)
                .eq('system', systemId);
            fetchUsers();
        } catch (err) {
            console.error(err);
            setError(err.message);
        }
    };

    const handleDeleteUserCompletely = async (userId) => {
        if (!window.confirm('¿Eliminar usuario de todos los sistemas?')) return;
        try {
            await supabase
                .from('admin_users')
                .delete()
                .eq('user', userId);
            fetchUsers();
            fetchAllUsers();
        } catch (err) {
            console.error(err);
            setError(err.message);
        }
    };
    const handleToggleActive = async (userId, isActive) => {
        try {
            await supabase
                .from('admin_users')
                .update({ is_active: !isActive })
                .eq('user', userId);
            fetchUsers();
        } catch (err) {
            console.error(err);
            setError(err.message);
        }
    };

    const handleAssociateUser = async (userId) => {
        try {
            await supabase
                .from('systems_users')
                .insert({ system: systemId, user_id: userId, is_active: true, reason: 'Asociado' });
            fetchUsers();
            fetchAllUsers();
        } catch (err) {
            console.error(err);
            setError(err.message);
        }
    };
    const fetchUsers = async () => {
        const { data, error } = await supabase
            .from('systems_users')
            .select('id, user_id, users(email), is_active') // ajusta según tu esquema
            .eq('system', systemId);

        if (error) {
            setError(error.message);
        } else {
            setUsers(data.map(u => ({
                id: u.user_id,
                email: u.users.email,
                is_active: u.is_active
            })));
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [systemId]);




    return (
        <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <h2>{texts.usersOptions}</h2>
            </AccordionSummary>
            <AccordionDetails>

                <h3>{texts.createUser}</h3>
                <form onSubmit={handleSubmit} className='form-container'>
                    <label>
                        {texts.email}
                    </label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder={texts.email}
                    />

                    <button type="submit" disabled={loading}>
                        {loading ? texts.creating : texts.createUser}
                    </button>
                </form>
                {message && <p style={{ color: 'green' }}>{texts[message]}</p>}
                {error && <p style={{ color: 'red' }}>{texts[error]}</p>}

                <h3>{texts.deleteUser}</h3>

                <DataGrid
                    rows={users}
                    columns={deleteColumns}
                    pageSize={5}
                    rowsPerPageOptions={[5, 10]}
                    checkboxSelection={false}
                />
                <h3>{texts.activateUser}</h3>

                <DataGrid
                    rows={users}
                    columns={activateColumns}
                    pageSize={5}
                    rowsPerPageOptions={[5, 10]}
                />
                <h3>{texts.associateUser}</h3>

                <DataGrid
                    rows={users}
                    columns={associateColumns}
                    pageSize={5}
                    rowsPerPageOptions={[5, 10]}
                />
            </AccordionDetails>
        </Accordion>
    );
}

