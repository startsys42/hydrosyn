
import '../../styles/theme.css';
import React, { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabaseClient';
import useTexts from '../../utils/UseTexts';
import { DataGrid } from '@mui/x-data-grid';
import { TextField, Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { DateTimePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import 'dayjs/locale/en';
import { useLanguage } from '../../utils/LanguageContext';

import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

// Extiende dayjs con los plugins
dayjs.extend(utc);
dayjs.extend(timezone);

export default function ListCalibrate({ systemId, calibrateList, refresh, userRole, error, setError }) {

    const texts = useTexts();
    const { language } = useLanguage();



    const [loading, setLoading] = useState(true);

    const [rows, setRows] = useState([]);
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

            const session = await supabase.auth.getSession();
            const userId = session?.data?.session?.user?.id;

            const { error } = await supabase.rpc(
                'delete_calibrate_between',
                {
                    p_from: fromUTC,
                    p_to: toUTC,
                    p_system_id: systemId,
                    p_user_id: userId
                }
            );

            if (error) throw error;

            setOpenDialog(false);


            // ✅ Refresca la lista de calibraciones desde el componente padre
            refresh();

        } catch (e) {
            setError(e.message);
        } finally {
            setDeleting(false);
        }
    };
    useEffect(() => {
        // Mapear los datos para DataGrid
        setRows(calibrateList.map((c, index) => ({
            id: index,
            pump_name: c.pump?.name || '--',
            user_email: c.user?.email || '--',
            volume: c.volume,
            created_at: new Date(c.created_at).toLocaleString()
        })));
    }, [calibrateList]);





    const columns = [
        { field: 'pump_name', headerName: 'Bomba', flex: 1, minWidth: 180 },
        { field: 'user_email', headerName: 'Email', flex: 1, minWidth: 220 },
        { field: 'volume', headerName: 'Volumen', flex: 1, minWidth: 120 },
        {
            field: 'created_at',
            headerName: texts.dateTime,
            minWidth: 150,
            flex: 1,
            renderCell: (params) => {
                if (!params.value) {
                    return '--';
                }
                try {
                    //const date = new Date(params.value);
                    //return dayjs(date).format('DD/MM/YYYY HH:mm:ss');
                    const date = new Date(params.value);

                    if (isNaN(date.getTime())) { return 'Date invalid'; }

                    return date.toLocaleString(undefined, {
                        //timeZone: 'UTC',
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                    });

                } catch (error) {

                    return 'Error date';
                }
            }
        },
    ];

    return (
        <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>


                <h1>{texts.listCalibrate}</h1>
            </AccordionSummary>
            <AccordionDetails>

                {userRole === 'owner' && (

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
                )}
                <div style={{ height: 500, width: 'auto' }}>
                    <DataGrid className="datagrid"
                        rows={rows}
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
            </AccordionDetails>
        </Accordion>


    );
}