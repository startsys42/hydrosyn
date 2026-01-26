import '../styles/theme.css';
import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import useTexts from '../utils/UseTexts';
import { DataGrid } from '@mui/x-data-grid';
import { TextField, Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { DateTimePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import 'dayjs/locale/en';
import { useLanguage } from '../utils/LanguageContext';

import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

// Extiende dayjs con los plugins
dayjs.extend(utc);
dayjs.extend(timezone);

export default function NotificationsAdmin() {


    const texts = useTexts();
    const { language } = useLanguage();


    const [attempts, setAttempts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [pageSize, setPageSize] = useState(10);
    const [page, setPage] = useState(0);
    const [fromDate, setFromDate] = useState(null);
    const [toDate, setToDate] = useState(null);

    const [openDialog, setOpenDialog] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        dayjs.locale(language); // 'es' o 'en' según tu contexto
    }, [language]);
    const handleDelete = async () => {
        if (!fromDate || !toDate) {
            setError('Please select both dates');
            return;
        }

        try {
            setDeleting(true);
            setError(null);

            const fromUTC = dayjs(fromDate).utc().format(); // Asegura UTC
            const toUTC = dayjs(toDate).utc().format(); // Asegura UTC

            const { error } = await supabase.rpc(
                'delete_login_attempts_between',
                {
                    p_from: fromUTC,
                    p_to: toUTC
                }
            );

            if (error) throw error;

            setOpenDialog(false);

            // refrescar datos
            setAttempts(prev =>
                prev.filter(a => {
                    if (!a.attempt_created_at) return true;
                    const d = new Date(a.attempt_created_at);
                    // Filtrar los que NO están dentro del rango
                    return d < new Date(fromUTC) || d > new Date(toUTC);
                })
            );

        } catch (e) {
            setError(e.message);
        } finally {
            setDeleting(false);
        }
    };

    useEffect(() => {
        const fetchLoginAttempts = async () => {
            try {
                setLoading(true);

                const { data: { session } } = await supabase.auth.getSession();
                if (!session || !session.user) throw new Error('User not authenticated');
                const userId = session.user.id;


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

    const translateReason = (reason) => {

        let translationKey;

        if (reason === 'Login attempt with a deactivated user') {
            translationKey = 'loginDisabled';
        } else if (reason === 'Password recovery attempt for an inactive user') {
            translationKey = 'recoveryDisabled';
        } else if (reason === 'User does not exist') {
            translationKey = 'userNotExists';
        } else if (reason === 'Invalid password') {
            translationKey = 'invalidPassword';
        } else {
            return reason;
        }


        return texts[translationKey];
    };

    const columns = [
        { field: 'user_email', headerName: 'Email', flex: 1, minWidth: 220 },
        {
            field: 'reason', headerName: texts.reason, flex: 1, minWidth: 220, renderCell: (params) => {
                return translateReason(params.value);
            }
        },
        {
            field: 'attempt_created_at',
            headerName: texts.dateTime,
            minWidth: 150,
            flex: 1,
            renderCell: (params) => {
                if (!params.value) {
                    return '--';
                }
                try {
                    const localDate = dayjs.utc(params.value).local();

                    return localDate.format('DD/MM/YYYY HH:mm:ss');
                    //const date = new Date(params.value);

                    // if (isNaN(date.getTime())) { return 'Date invalid'; }
                    /*
                    return date.toLocaleString(undefined, {
                        //timeZone: 'UTC',
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                    });
                    */
                } catch (error) {

                    return 'Error date';
                }
            }
        },
    ];

    return (
        <div className='div-main-login'>
            <h1>{texts.notifications}</h1>

            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={language}>
                <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                    <DateTimePicker
                        label={texts.fromDate ?? 'From'}
                        value={fromDate}
                        onChange={setFromDate}
                        renderInput={(params) => <TextField {...params} size="small" />}
                    />

                    <DateTimePicker
                        label={texts.toDate ?? 'To'}
                        value={toDate}
                        onChange={setToDate}
                        renderInput={(params) => <TextField {...params} size="small" />}
                    />

                    <button

                        disabled={!fromDate || !toDate}
                        onClick={() => setOpenDialog(true)}
                    >
                        {texts.delete ?? 'Delete'}
                    </button>
                </div>
            </LocalizationProvider>

            <div style={{ height: 500, width: 'auto' }}>
                <DataGrid className="datagrid"
                    rows={attempts.map((a, index) => ({ id: index, ...a }))}
                    columns={columns}
                    loading={loading}
                    pagination
                    pageSize={pageSize}
                    onPageSizeChange={setPageSize}
                    sortingMode="client"


                    disableSelectionOnClick
                />
            </div>

            {error && <p style={{ color: 'red' }}>{error}</p>}

            <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
                <DialogTitle>
                    {texts.confirmation}
                </DialogTitle>

                <DialogContent>
                    {texts.deleteBetweenDates}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>{texts.no}</Button>
                    <Button onClick={handleDelete} variant="contained" color="error" disabled={loading}>{texts.yes}</Button>
                </DialogActions>


            </Dialog>
        </div>


    );
}