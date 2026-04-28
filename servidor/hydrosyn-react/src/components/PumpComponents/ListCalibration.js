//import '../../styles/themeo.css';
import React, { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabaseClient';
import useTexts from '../../utils/UseTexts';
import { DataGrid } from '@mui/x-data-grid';
import { TextField, Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { DateTimePicker, LocalizationProvider } from '@mui/x-date-pickers';

import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import 'dayjs/locale/en';
import { useLanguage } from '../../utils/LanguageContext';

import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';


dayjs.extend(utc);
dayjs.extend(timezone);

export default function ListCalibration({ systemId, calibrationList, refresh, userRole, error, setError }) {

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
        dayjs.locale(language);
    }, [language]);
    const handleDelete = async () => {
        if (!fromDate || !toDate) {
            setError(texts.bothDates);
            return;
        }

        try {
            setDeleting(true);
            setError(null);

            const fromUTC = dayjs(fromDate).utc().format();
            const toUTC = dayjs(toDate).utc().format();

            const session = await supabase.auth.getSession();
            const userId = session?.data?.session?.user?.id;

            const { error } = await supabase.rpc(
                'delete_calibrations_between',
                {
                    p_from: fromUTC,
                    p_to: toUTC,
                    p_system_id: systemId,
                    p_user_id: userId
                }
            );

            if (error) throw error;

            setOpenDialog(false);



            refresh();

        } catch (e) {
            setError(e.message);
        } finally {
            setDeleting(false);
        }
    };
    useEffect(() => {
        setRows(calibrationList.map((c) => ({
            id: c.id,
            pump_name: c.pump_name || '--',
            user_email: c.user_email || '--',
            success: c.success ? '✔' : '✖',
            created_at: c.created_at
        })));
        setLoading(false);
    }, [calibrationList]);





    const columns = [
        { field: 'pump_name', headerName: texts.pumps, flex: 1, minWidth: 180 },
        { field: 'user_email', headerName: texts.email, flex: 1, minWidth: 220 },
        { field: 'success', headerName: texts.success, flex: 1, minWidth: 120 },
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


                    const date = new Date(params.value);

                    if (isNaN(date.getTime())) { return 'Date invalid'; }

                    return date.toLocaleString(undefined, {

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


                <h3>{texts.listCalibrations}</h3>
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