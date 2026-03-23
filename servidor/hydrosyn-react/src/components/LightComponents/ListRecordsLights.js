// ListRecordsLights.jsx
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
import Chip from '@mui/material/Chip';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import 'dayjs/locale/en';
import { useLanguage } from '../../utils/LanguageContext';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export default function ListRecordsLights({ systemId, refresh, userRole, error, setError }) {
    const texts = useTexts();
    const { language } = useLanguage();

    const [loading, setLoading] = useState(true);
    const [rows, setRows] = useState([]);
    const [pageSize, setPageSize] = useState(10);
    const [fromDate, setFromDate] = useState(null);
    const [toDate, setToDate] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        dayjs.locale(language);
    }, [language]);

    // Función para obtener el historial
    const fetchRecords = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .rpc('get_lights_history', {
                    p_system_id: systemId,
                    p_days_back: 30
                });

            if (error) throw error;

            const formattedRows = (data || []).map(record => ({
                id: record.id,
                light_name: record.light_name,
                action: record.action === 1 ? (texts.turnedOn || "Encendió") : (texts.turnedOff || "Apagó"),
                action_value: record.action,
                created_at: record.created_at
            }));

            setRows(formattedRows);
        } catch (err) {
            console.error("Error fetching light records:", err);
            if (setError) setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Cargar datos al montar y cuando cambia systemId
    useEffect(() => {
        if (systemId) {
            fetchRecords();
        }
    }, [systemId]);

    // Eliminar registros entre fechas
    const handleDelete = async () => {
        if (!fromDate || !toDate) {
            if (setError) setError(texts.bothDates || "Selecciona ambas fechas");
            return;
        }

        try {
            setDeleting(true);
            if (setError) setError(null);

            const fromUTC = dayjs(fromDate).utc().format();
            const toUTC = dayjs(toDate).utc().format();

            const session = await supabase.auth.getSession();
            const userId = session?.data?.session?.user?.id;

            const { error } = await supabase.rpc(
                'delete_lights_history_between',
                {
                    p_from: fromUTC,
                    p_to: toUTC,
                    p_system_id: systemId,
                    p_user_id: userId
                }
            );

            if (error) throw error;

            setOpenDialog(false);
            setFromDate(null);
            setToDate(null);

            // Refrescar la lista
            fetchRecords();
            if (refresh) refresh();

        } catch (e) {
            console.error("Error deleting records:", e);
            if (setError) setError(e.message);
        } finally {
            setDeleting(false);
        }
    };

    // Columnas para el DataGrid
    const columns = [
        {
            field: 'light_name',
            headerName: texts.lights || "Luz",
            flex: 1,
            minWidth: 150
        },
        {
            field: 'action',
            headerName: texts.action || "Acción",
            flex: 0.8,
            minWidth: 120,
            renderCell: (params) => {
                const isOn = params.value === (texts.turnedOn || "Encendió");
                return (
                    <Chip
                        label={params.value}
                        color={isOn ? "success" : "default"}
                        size="small"
                        variant={isOn ? "filled" : "outlined"}
                    />
                );
            }
        },
        {
            field: 'created_at',
            headerName: texts.dateTime || "Fecha/Hora",
            minWidth: 180,
            flex: 1,
            renderCell: (params) => {
                if (!params.value) return '--';
                try {
                    const date = new Date(params.value);
                    if (isNaN(date.getTime())) return 'Fecha inválida';
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
                <h3>{texts.lightsHistory || "Historial de Luces"}</h3>
            </AccordionSummary>
            <AccordionDetails>
                {/* Solo los owners pueden eliminar registros */}
                {userRole === 'owner' && (
                    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={language}>
                        <div style={{ display: 'flex', gap: 16, marginBottom: 16, alignItems: 'center' }}>
                            <DateTimePicker
                                label={texts.fromDate ?? 'Desde'}
                                value={fromDate}
                                onChange={setFromDate}
                                renderInput={(params) => <TextField {...params} size="small" />}
                            />
                            <DateTimePicker
                                label={texts.toDate ?? 'Hasta'}
                                value={toDate}
                                onChange={setToDate}
                                renderInput={(params) => <TextField {...params} size="small" />}
                            />
                            <Button
                                variant="contained"
                                color="error"
                                disabled={!fromDate || !toDate || deleting}
                                onClick={() => setOpenDialog(true)}
                            >
                                {texts.delete ?? 'Eliminar'}
                            </Button>
                        </div>
                    </LocalizationProvider>
                )}

                {/* Tabla con el historial */}
                <div style={{ height: 500, width: '100%' }}>
                    <DataGrid
                        className="datagrid"
                        rows={rows}
                        columns={columns}
                        loading={loading}
                        pagination
                        pageSize={pageSize}
                        onPageSizeChange={setPageSize}
                        rowsPerPageOptions={[5, 10, 25, 50]}
                        sortingMode="client"
                        disableSelectionOnClick
                    />
                </div>

                {error && <p style={{ color: 'red', marginTop: 16 }}>{error}</p>}

                {/* Diálogo de confirmación para eliminar */}
                <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
                    <DialogTitle>{texts.confirmation || "Confirmación"}</DialogTitle>
                    <DialogContent>
                        {texts.deleteBetweenDates || "¿Estás seguro de que quieres eliminar los registros entre las fechas seleccionadas?"}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpenDialog(false)}>
                            {texts.no || "No"}
                        </Button>
                        <Button
                            onClick={handleDelete}
                            variant="contained"
                            color="error"
                            disabled={deleting}
                        >
                            {texts.yes || "Sí"}
                        </Button>
                    </DialogActions>
                </Dialog>
            </AccordionDetails>
        </Accordion>
    );
}