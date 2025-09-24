import '../styles/theme.css';
import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import useTexts from '../utils/UseTexts';
import { DataGrid } from '@mui/x-data-grid';


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
        { field: 'user_email', headerName: 'Email', flex: 1, minWidth: 150 },
        { field: 'reason', headerName: texts.reason, flex: 1, minWidth: 150 },
        {
            field: 'attempt_created_at',
            headerName: texts.dateTime,
            flex: 1,
            renderCell: (params) => {
                if (!params.value) {
                    return '--';
                }
                try {
                    const date = new Date(params.value);
                    console.log('JS Date object:', date);
                    console.log('ISO String:', date.toISOString());
                    console.log('UTC Hours:', date.getUTCHours(), 'UTC Minutes:', date.getUTCMinutes());
                    if (isNaN(date.getTime())) {
                        return 'Date invalid';
                    }
                    return date.toLocaleString(undefined, {
                        timeZone: 'UTC',
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit' // Añadimos segundos para más precisión
                    });
                } catch (error) {
                    console.error('Error formateando fecha:', error);
                    return 'Error date';
                }
            }
        },
    ];

    return (
        <div className='div-main-login'>
            <h1>{texts.notifications}</h1>



            <div style={{ height: 500, width: '100%' }}>
                <DataGrid className="datagrid"
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