
import '../../styles/theme.css';
import React, { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabaseClient';
import useTexts from '../../utils/UseTexts';
import { DataGrid } from '@mui/x-data-grid';
import { TextField, Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { DateTimePicker, LocalizationProvider } from '@mui/x-date-pickers';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import 'dayjs/locale/en';
import { useLanguage } from '../../utils/LanguageContext';

import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

// Extiende dayjs con los plugins
dayjs.extend(utc);
dayjs.extend(timezone);

export default function ListRecords({
    systemId,
    recordList,
    refresh,
    userRole,
    error,
    setError
}) {

    const texts = useTexts();
    const { language } = useLanguage();

    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pageSize, setPageSize] = useState(10);

    const [fromDate, setFromDate] = useState(null);
    const [toDate, setToDate] = useState(null);

    const [openDialog, setOpenDialog] = useState(false);

    useEffect(() => {
        dayjs.locale(language);
    }, [language]);

    // Mapear datos

    useEffect(() => {
        const mapped = recordList.map(r => {
            let displayVolume = r.volume;
            let displayUnit = 'L';

            if (r.volume < 1) {
                displayVolume = r.volume * 1000; // pasamos a mL
                displayUnit = 'mL';
            }

            return {
                id: r.id,
                tank_name: r.tank_name || '--',
                volume: `${displayVolume.toFixed(3)} ${displayUnit}`,
                created_at: r.created_at,
                user_email: r.user_email || '--'
            };
        });
        setRows(mapped);
    }, [recordList]);

    // Eliminar entre fechas (solo owner)
    const handleDelete = async () => {

        if (!fromDate || !toDate) {
            setError(texts.bothDates);
            return;
        }

        try {
            setLoading(true);
            setError("");

            const fromUTC = dayjs(fromDate).utc().format();
            const toUTC = dayjs(toDate).utc().format();

            const { error } = await supabase
                .from("records")
                .delete()
                .gte("created_at", fromUTC)
                .lte("created_at", toUTC);

            if (error) throw error;

            setOpenDialog(false);
            refresh();

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        { field: 'tank_name', headerName: texts.tanks, flex: 1 },

        { field: 'user_email', headerName: texts.email, flex: 1 },
        { field: 'volume', headerName: texts.volume, flex: 1 },
        {
            field: 'created_at',
            headerName: texts.date,
            flex: 1,
            renderCell: (params) => {
                if (!params.value) return '--';
                return new Date(params.value).toLocaleString();
            }
        }
    ];

    return (
        <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <h3>{texts.listRecords}</h3>
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