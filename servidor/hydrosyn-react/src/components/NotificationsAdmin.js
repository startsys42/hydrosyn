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

    const [filterEmail, setFilterEmail] = useState('');
    const [filterReason, setFilterReason] = useState('');


    const [filterStartDate, setFilterStartDate] = useState(null);
    const [filterEndDate, setFilterEndDate] = useState(null);


    useEffect(() => {
        const fetchLoginAttempts = async () => {
            try {
                setLoading(true);
                // Llama a la función de base de datos que creaste
                const { data, error } = await supabase.rpc('get_admin_login_attempts_with_user_email');

                if (error) {
                    throw error;
                }

                setAttempts(data);
            } catch (e) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        };

        fetchLoginAttempts();
    }, []);

    const filteredAttempts = attempts.filter((attempt) => {
        const attemptDate = new Date(attempt.created_at);

        return (
            (!filterEmail || attempt.user_email.includes(filterEmail)) &&
            (!filterStartDate || attemptDate >= filterStartDate) &&
            (!filterEndDate || attemptDate <= filterEndDate)
        );
    });

    const reasons = [...new Set(attempts.map((a) => a.reason))]; // Lista única de razones

    const columns = [
        { field: 'user_email', headerName: 'Email', flex: 1 },
        { field: 'reason', headerName: 'Razón', flex: 1 },
        {
            field: 'created_at',
            headerName: 'Fecha y Hora',
            flex: 1,
            valueFormatter: (params) => new Date(params.value).toLocaleString()
        },
    ];

    return (
        <div className='div-main-login'>
            <h1>{texts.notifications}</h1>

            <div>
                <TextField
                    label="Filtrar por correo"
                    value={filterEmail}
                    onChange={(e) => setFilterEmail(e.target.value)}
                />

                <TextField
                    select
                    label="Filtrar por tipo"
                    value={filterReason}
                    onChange={(e) => setFilterReason(e.target.value)}
                    style={{ minWidth: 150 }}
                >
                    <MenuItem value="">Todos</MenuItem>
                    {reasons.map((r) => (
                        <MenuItem key={r} value={r}>{r}</MenuItem>
                    ))}
                </TextField>

                <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                        label="Desde"
                        value={filterStartDate}
                        onChange={(newValue) => setFilterStartDate(newValue)}
                        renderInput={(params) => <TextField {...params} />}
                    />
                    <DatePicker
                        label="Hasta"
                        value={filterEndDate}
                        onChange={(newValue) => setFilterEndDate(newValue)}
                        renderInput={(params) => <TextField {...params} />}
                    />
                </LocalizationProvider>
            </div>

            <div style={{ height: 500, width: '100%' }}>
                <DataGrid
                    rows={filteredAttempts.map((a, index) => ({ id: index, ...a }))}
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