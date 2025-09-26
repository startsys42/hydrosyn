import '../styles/theme.css';
import React, { useEffect, useState } from 'react'
import { supabase } from '../utils/supabaseClient';
import useTexts from '../utils/UseTexts';
import { DataGrid } from '@mui/x-data-grid';
import { Checkbox, Button, Dialog, DialogTitle, DialogContent, DialogActions, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const ActivateDeleteUserAdmin = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const t = useTexts();
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [toggleValue, setToggleValue] = useState(false);
    const navigate = useNavigate();

    useEffect(() => { fetchUsers() }, []);

    const fetchUsers = async () => {
        const { data, error } = await supabase.rpc('get_admin_users_with_emails');
        if (error) console.error(error);
        else setUsers(data || []);
        setLoading(false);
    };

    const handleToggleClick = (user) => {
        setCurrentUser(user);
        setToggleValue(user.is_active);
        setConfirmOpen(true);
    };

    const handleToggleConfirm = async () => {
        if (!currentUser) return;
        const { error } = await supabase
            .from('admin_users')
            .update({ is_active: !toggleValue })
            .eq('id', currentUser.id);

        if (error) console.error(error);
        else {
            setUsers((prev) =>
                prev.map((u) => u.id === currentUser.id ? { ...u, is_active: !toggleValue } : u)
            );
        }

        setConfirmOpen(false);
        setCurrentUser(null);
    };

    const handleDeleteClick = (user) => {
        setCurrentUser(user);
        setDeleteOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!currentUser) return;
        const { error } = await supabase
            .from('admin_users')
            .delete()
            .eq('id', currentUser.id);

        if (error) console.error(error);
        else setUsers((prev) => prev.filter((u) => u.id !== currentUser.id));

        setDeleteOpen(false);
        setCurrentUser(null);
    };

    const columns = [
        { field: 'email', headerName: t.email, width: 250 },
        {
            field: 'is_active',
            headerName: t.active,
            width: 150,
            renderCell: (params) => (
                <Checkbox
                    checked={params.value}
                    onChange={() => handleToggleClick(params.row)}
                />
            )
        },
        {
            field: 'actions',
            headerName: t.delete,
            sortable: false,
            disableColumnMenu: true,
            filterable: false,
            width: 150,
            renderCell: (params) => (
                <button style={{ padding: '4px 16px' }} onClick={() => navigate(`/system/${params.row.id}`)}>
                    {t.delete}
                </button>
            )
        }
    ];

    if (loading) return <Typography>Cargando usuarios...</Typography>;

    return (
        <div className='div-main-login'>
            <h1>{t.users}</h1>


            <DataGrid
                rows={users}
                columns={columns}
                autoHeight
                pagination
                pageSize={5}
                rowsPerPageOptions={[5, 10]}
                disableSelectionOnClick
                getRowId={(row) => row.id}
            />


            {/* Confirmación para toggle */}
            <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
                <DialogTitle>Confirmar acción</DialogTitle>
                <DialogContent>
                    <Typography>
                        ¿Está seguro que desea {toggleValue ? 'desactivar' : 'activar'} al usuario {currentUser?.email}?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmOpen(false)}>No</Button>
                    <Button onClick={handleToggleConfirm} variant="contained">Sí</Button>
                </DialogActions>
            </Dialog>

            {/* Confirmación para borrar */}
            <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
                <DialogTitle>Confirmar eliminación</DialogTitle>
                <DialogContent>
                    <Typography>
                        ¿Está seguro que desea eliminar al usuario {currentUser?.email}?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteOpen(false)}>No</Button>
                    <Button onClick={handleDeleteConfirm} variant="contained" color="error">Sí</Button>
                </DialogActions>
            </Dialog>
        </div>
    )
}

export default ActivateDeleteUserAdmin;
