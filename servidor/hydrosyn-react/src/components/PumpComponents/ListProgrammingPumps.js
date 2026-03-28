import { useState } from "react";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { DataGrid } from "@mui/x-data-grid";
import { IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from "@mui/material";
import { Delete as DeleteIcon } from "@mui/icons-material";
import { supabase } from "../../utils/supabaseClient";
import { useNavigate } from "react-router-dom";
import useTexts from "../../utils/UseTexts";
import '../../styles/theme.css';
import { Edit as EditIcon } from "@mui/icons-material";
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import dayjs from 'dayjs';

export default function ListProgrammingPumps({ pumpList, programmingList, refresh, error, setError, userRole }) {
    const texts = useTexts();
    const navigate = useNavigate();

    const [pageSize, setPageSize] = useState(10);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedProgramming, setSelectedProgramming] = useState(null);
    const [loading, setLoading] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editFormData, setEditFormData] = useState(null);

    const DAYS = [
        { value: "Monday", label: texts.dayMonday },
        { value: "Tuesday", label: texts.dayTuesday },
        { value: "Wednesday", label: texts.dayWednesday },
        { value: "Thursday", label: texts.dayThursday },
        { value: "Friday", label: texts.dayFriday },
        { value: "Saturday", label: texts.daySaturday },
        { value: "Sunday", label: texts.daySunday },
    ];
    const handleEditClick = (programming) => {
        setEditFormData({ ...programming }); // copiamos los datos de la fila
        setEditDialogOpen(true);
    };

    const getPumpName = (pumpId) => {
        const pump = pumpList.find(p => p.id === pumpId);
        return pump ? pump.name : "-";
    };

    const getDayLabel = (dayValue) => {
        const days = {
            Monday: texts.dayMonday,
            Tuesday: texts.dayTuesday,
            Wednesday: texts.dayWednesday,
            Thursday: texts.dayThursday,
            Friday: texts.dayFriday,
            Saturday: texts.daySaturday,
            Sunday: texts.daySunday,
        };
        return days[dayValue] || dayValue;
    };

    const formatTime = (time) => time?.substring(0, 5) || "--:--";

    const handleDeleteClick = (programming) => {
        setSelectedProgramming(programming);
        setDeleteDialogOpen(true);
    };
    const handleEditConfirm = async () => {
        if (!editFormData) return;
        setLoading(true);
        try {
            const { error } = await supabase
                .from("programming_pumps")
                .update({
                    pump: editFormData.pump_id,
                    day_of_week: editFormData.day_of_week,
                    clock: editFormData.clock,
                    volume: Number(editFormData.volume),
                })
                .eq("id", editFormData.id);

            if (error) throw error;

            refresh(); // recarga la lista
            setEditDialogOpen(false);
            setEditFormData(null);
        } catch (err) {
            setError("Error" || err.message);
        } finally {
            setLoading(false);
        }
    };
    const handleDeleteConfirm = async () => {
        if (!selectedProgramming) return;
        setLoading(true);
        try {
            const { data: sessionData } = await supabase.auth.getSession();
            if (!sessionData?.session) {
                navigate("/dashboard");
                return;
            }

            const { error } = await supabase
                .from("programming_pumps")
                .delete()
                .eq("id", selectedProgramming.id);

            if (error) throw error;

            refresh();
            setDeleteDialogOpen(false);
            setSelectedProgramming(null);
            setError(null);
        } catch (err) {
            setError("Error" || err.message);
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        { field: 'pumpName', headerName: texts.pumps, flex: 1, minWidth: 150 },
        { field: 'day', headerName: texts.days, flex: 1, minWidth: 120 },
        { field: 'time', headerName: texts.time, flex: 1, minWidth: 100 },
        {
            field: 'volume',
            headerName: texts.volume,
            flex: 1,
            minWidth: 120,
            renderCell: (params) => {
                let vol = Number(params.value);
                let unit = 'L';
                if (vol < 1) {
                    vol = vol * 1000;
                    unit = 'mL';
                }
                return `${vol.toFixed(3)} ${unit}`;
            }
        },
    ];

    if (userRole === 'owner') {
        columns.push({
            field: 'actions',
            headerName: texts.delete,
            width: 80,
            sortable: false,
            filterable: false,
            renderCell: (params) => (
                <IconButton size="small" color="error" onClick={() => handleDeleteClick(params.row.originalData)}>
                    <DeleteIcon />
                </IconButton>
            )
        });
        if (userRole === 'owner') {
            columns.push({
                field: 'edit',
                headerName: texts.update,
                width: 80,
                sortable: false,
                filterable: false,
                renderCell: (params) => (
                    <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleEditClick(params.row.originalData)}
                    >
                        <EditIcon />
                    </IconButton>
                )
            });
        }
    }

    const rows = programmingList.map(prog => ({
        id: prog.id,
        pumpName: prog.pump?.name || getPumpName(prog.pump_id),
        day: getDayLabel(prog.day_of_week),
        time: formatTime(prog.clock),
        volume: prog.volume,
        originalData: prog
    }));

    return (
        <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <h3>{texts.listProgrammingPumps}</h3>
            </AccordionSummary>
            <AccordionDetails>

                <div style={{ height: 500, width: '100%' }}>
                    <DataGrid
                        className="datagrid"
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

                <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                    <DialogTitle>{texts.confirmation}</DialogTitle>
                    <DialogContent>
                        <Typography>
                            {`${texts.deleteProgrammingQuestion}  ${texts.actionIrreversible}`}

                        </Typography>

                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setDeleteDialogOpen(false)}>{texts.no}</Button>
                        <Button onClick={handleDeleteConfirm} variant="contained" color="error" disabled={loading}>
                            {loading ? texts.deleting : texts.yes}
                        </Button>
                    </DialogActions>
                </Dialog>
                <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} className="light-dialog">
                    <DialogTitle>{texts.updateProgrammingPump}</DialogTitle>
                    <DialogContent>
                        {editFormData && (
                            <form className="form-container">
                                <label>{texts.selectPump}</label>
                                <select
                                    value={editFormData.pump_id}
                                    onChange={(e) =>
                                        setEditFormData({
                                            ...editFormData,
                                            pump_id: Number(e.target.value),
                                        })
                                    }
                                >
                                    {pumpList.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.name}
                                        </option>
                                    ))}
                                </select>

                                <label>{texts.days}</label>
                                <select
                                    value={editFormData.day_of_week}
                                    onChange={(e) =>
                                        setEditFormData({ ...editFormData, day_of_week: e.target.value })
                                    }
                                >
                                    {DAYS.map((d) => (
                                        <option key={d.value} value={d.value}>
                                            {d.label}
                                        </option>
                                    ))}
                                </select>

                                <label>{texts.time}</label>
                                <LocalizationProvider dateAdapter={AdapterDayjs}>
                                    <TimePicker
                                        label={texts.time}
                                        value={editFormData.clock ? dayjs(editFormData.clock, "HH:mm:ss") : null}
                                        onChange={(newValue) =>
                                            setEditFormData({
                                                ...editFormData,
                                                clock: newValue ? newValue.format("HH:mm:ss") : "",
                                            })
                                        }
                                        ampm={false}
                                        minutesStep={1}
                                        disabled={loading}
                                    />

                                </LocalizationProvider>
                                <label>{texts.volume}</label>
                                <input
                                    type="number"
                                    value={editFormData.volume}
                                    min="0.001"
                                    step="0.001"
                                    max="999.999"
                                    onChange={(e) =>
                                        setEditFormData({ ...editFormData, volume: e.target.value })
                                    }
                                />
                                <label>{texts.units}</label>
                                <select
                                    value={editFormData.unit || "L"}
                                    onChange={(e) =>
                                        setEditFormData({ ...editFormData, unit: e.target.value })
                                    }
                                >
                                    <option value="L">L</option>
                                    <option value="mL">mL</option>
                                </select>

                                {error && <p style={{ color: "red" }}>{texts[error] || error}</p>}
                            </form>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setEditDialogOpen(false)}>{texts.cancel}</Button>
                        <Button
                            onClick={async () => {
                                setError("");

                                // Validaciones
                                if (!editFormData.pump_id) return setError("selectPump");
                                if (!editFormData.clock) return setError("selectHour");
                                if (!editFormData.volume || Number(editFormData.volume) <= 0)
                                    return setError("invalidVolume");

                                let vol = Number(editFormData.volume);
                                if (editFormData.unit === "mL") vol = vol / 1000;
                                if (vol > 999.999) return setError("volumeTooHigh");

                                // Conflictos
                                const conflict = programmingList.some(
                                    (p) =>
                                        p.id !== editFormData.id &&
                                        p.pump_id === editFormData.pump_id &&
                                        p.day_of_week === editFormData.day_of_week &&
                                        p.clock === editFormData.clock
                                );
                                if (conflict) return setError("conflictProgramming");

                                // Actualización en supabase
                                setLoading(true);
                                try {
                                    const { error } = await supabase
                                        .from("programming_pumps")
                                        .update({
                                            pump: editFormData.pump_id,
                                            day_of_week: editFormData.day_of_week,
                                            clock: editFormData.clock,
                                            volume: vol,
                                        })
                                        .eq("id", editFormData.id);

                                    if (error) throw error;

                                    refresh();
                                    setEditDialogOpen(false);
                                    setEditFormData(null);
                                } catch (err) {
                                    setError("Error" || err.message);
                                } finally {
                                    setLoading(false);
                                }
                            }}
                            variant="contained"
                            disabled={loading}
                        >
                            {loading ? texts.updating : texts.update}
                        </Button>
                    </DialogActions>
                </Dialog>
            </AccordionDetails>
        </Accordion>
    );
}