import '../styles/theme.css';
import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import useTexts from '../utils/UseTexts';
import { DataGrid } from '@mui/x-data-grid';
import { TextField, MenuItem, Box } from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';

export default function NotificationsAdmin() {


    const texts = useTexts();


    const [attempts, setAttempts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);




    useEffect(() => {
        const fetchLoginAttempts = async () => {
            try {
                setLoading(true);
                // Llama a la función de base de datos que creaste
                const { data: { session } } = await supabase.auth.getSession();
                if (!session || !session.user) throw new Error('User not authenticated');
                const userId = session.user.id;

                // Llamar a la RPC pasando el userId
                const { data, error } = await supabase.rpc(
                    'get_admin_login_attempts_with_user_email',
                    { p_user_id: userId }
                );
                if (error) {
                    throw error;
                }

                setAttempts(data || []);
            } catch (e) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        };

        fetchLoginAttempts();
    }, []);



    const columns = [
        { field: 'user_email', headerName: 'Email', flex: 1 },
        { field: 'reason', headerName: texts.reason, flex: 1 },
        {
            field: 'attempt_created_at',
            headerName: texts.date,
            flex: 1,
            valueFormatter: (params) => new Date(params.value).toLocaleDateString()
        },
    ];

    return (
        <div className='div-main-login'>
            <h1>{texts.notifications}</h1>



            <div style={{ height: 500, width: '100%' }}>
                <DataGrid
                    rows={attempts.map((a, index) => ({ id: index, ...a }))}
                    columns={columns}
                    loading={loading}
                    pageSize={10}
                    rowsPerPageOptions={[5, 10, 20]}
                    pagination
                />
            </div>

            {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
    );
}