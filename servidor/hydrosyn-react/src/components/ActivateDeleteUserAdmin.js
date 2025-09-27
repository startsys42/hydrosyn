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
    const texts = useTexts();
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [pageSize, setPageSize] = useState(10);
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

    const handleToggleClick = async (user) => {
        const { data, error } = await supabase.auth.getSession();
        const session = data?.session;
        const currentUserId = session?.user?.id;
        const { data: roleData, error: roleError } = await supabase
            .from('roles')
            .select('user')
            .eq('user', currentUserId)
            .maybeSingle();

        if (roleError) {

            return;
        }


        if (!roleData) {
            navigate('/dashboard', { replace: true });
            return;
        }
        setCurrentUser(user);
        setToggleValue(user.is_active);
        setConfirmOpen(true);
    };

    const handleToggleConfirm = async () => {
        if (!currentUser) return;
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const accessToken = session?.access_token;

            // Llamada a la Edge Function
            const { data, error } = await supabase.functions.invoke('activateUserAdmin', {
                body: {
                    userId: currentUser.id,
                    isActive: !toggleValue,
                }
            });

            if (error) throw new Error(error.message);
            if (data.error) throw new Error(data.error);

            // Actualiza la tabla local
            setUsers(prev =>
                prev.map(u => u.id === currentUser.id ? { ...u, is_active: !toggleValue } : u)
            );
        } catch (err) {
            console.error(err);

            setConfirmOpen(false);
            setCurrentUser(null);
        }
    };
    const handleDeleteClick = async (user) => {
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !data?.session) {

            navigate('/dashboard', { replace: true });
            return;
        }
        const currentUserId = data.session.user.id;
        const { data: roleData, error: roleError } = await supabase
            .from('roles')
            .select('user')
            .eq('user', currentUserId)
            .maybeSingle();

        if (roleError) {

            return;
        }


        if (!roleData) {
            navigate('/dashboard', { replace: true });
            return;
        }
        setCurrentUser({ ...user });
        setDeleteOpen(true);
    };
    const handleDeleteConfirm = async () => {
        if (!currentUser) return;

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const accessToken = session?.access_token;

            // Llamada a la Edge Function de borrado
            const { data, error } = await supabase.functions.invoke('deleteAdminUser', {
                body: {
                    userId: currentUser.id
                }
            });

            if (error) throw new Error(error.message);
            if (data.error) throw new Error(data.error);

            // Actualiza la tabla local
            setUsers(prev => prev.filter(u => u.id !== currentUser.id));
        } catch (err) {
            console.error(err);
        }

        setDeleteOpen(false);
        setCurrentUser(null);
    };



    const columns = [
        { field: 'email', headerName: texts.email, width: 250 },
        {
            field: 'is_active',
            headerName: texts.active,
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
            headerName: texts.delete,
            sortable: false,
            disableColumnMenu: true,
            filterable: false,
            width: 150,
            renderCell: (params) => (
                <button style={{ padding: '4px 16px' }} onClick={() => handleDeleteClick(params.row)}>
                    {texts.delete}
                </button>
            )
        }
    ];





    if (loading) return <p> </p>;

    return (
        <div className='div-main-login'>
            <h1>{texts.users}</h1>


            <div style={{ height: 500, width: '100%' }}>
                <DataGrid className="datagrid"
                    rows={users.map(u => ({ id: u.user, email: u.email, is_active: u.is_active }))}
                    columns={columns}
                    loading={loading}
                    pagination
                    pageSize={pageSize}
                    onPageSizeChange={setPageSize}
                    sortingMode="client"


                    disableSelectionOnClick
                />
            </div>


            {/* Confirmación para toggle */}
            <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
                <DialogTitle>{texts.confirmation}</DialogTitle>
                <DialogContent>
                    <Typography>
                        {toggleValue
                            ? `${texts.deactivateUser} ${currentUser?.email}?`
                            : `${texts.activateUser} ${currentUser?.email}?`}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmOpen(false)}>{texts.no}</Button>
                    <Button onClick={handleToggleConfirm} variant="contained">{texts.yes}</Button>
                </DialogActions>
            </Dialog>

            {/* Confirmación para borrar */}
            <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
                <DialogTitle>{texts.confirmation}</DialogTitle>
                <DialogContent>
                    <Typography>
                        {`${texts.deleteUser} ${currentUser?.email}? ${texts.actionIrreversible}`}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteOpen(false)}>{texts.no}</Button>
                    <Button onClick={handleDeleteConfirm} variant="contained" color="error">{texts.yes}</Button>
                </DialogActions>
            </Dialog>
        </div>
    )
}

export default ActivateDeleteUserAdmin;
