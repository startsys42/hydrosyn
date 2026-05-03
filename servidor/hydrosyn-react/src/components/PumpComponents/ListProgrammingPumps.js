import { useState } from "react";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { DataGrid } from "@mui/x-data-grid";
import { IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, FormControl, InputLabel, Select, MenuItem, TextField, Stack, Alert } from "@mui/material";
import { Delete as DeleteIcon } from "@mui/icons-material";
import { supabase } from "../../utils/supabaseClient";
import { useNavigate } from "react-router-dom";
import useTexts from "../../utils/UseTexts";

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
        setEditFormData({ ...programming });
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

            refresh();
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
        { field: 'day', headerName: texts.day, flex: 1, minWidth: 120 },
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
            flex: 0.5,
            minWidth: 70,
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
                flex: 0.5,
                minWidth: 70,
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
                <Typography variant="h6" component="h3">{texts.listProgrammingPumps}</Typography>
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
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
                                <FormControl fullWidth disabled={loading}>
                                    <InputLabel id="edit-pump-select-label">{texts.selectPump}</InputLabel>
                                    <Select
                                        labelId="edit-pump-select-label"
                                        label={texts.selectPump}
                                        value={editFormData.pump_id}
                                        onChange={(e) => setEditFormData({ ...editFormData, pump_id: Number(e.target.value) })}
                                    >
                                        {pumpList.map((p) => (
                                            <MenuItem key={p.id} value={p.id}>
                                                {p.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <FormControl fullWidth disabled={loading}>
                                    <InputLabel id="edit-day-select-label">{texts.days}</InputLabel>
                                    <Select
                                        labelId="edit-day-select-label"
                                        label={texts.days}
                                        value={editFormData.day_of_week}
                                        onChange={(e) => setEditFormData({ ...editFormData, day_of_week: e.target.value })}
                                    >
                                        {DAYS.map((d) => (
                                            <MenuItem key={d.value} value={d.value}>
                                                {d.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

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
                                        sx={{ width: '100%' }}
                                    />
                                </LocalizationProvider>

                                <Stack direction="row" spacing={2}>
                                    <TextField
                                        label={texts.volume}
                                        type="number"
                                        value={editFormData.volume}
                                        onChange={(e) => setEditFormData({ ...editFormData, volume: e.target.value })}
                                        disabled={loading}
                                        required
                                        fullWidth
                                        inputProps={{ step: "0.001", min: "0.001", max: "999.999" }}
                                    />

                                    <FormControl disabled={loading} sx={{ minWidth: 100 }}>
                                        <InputLabel id="edit-unit-select-label">{texts.units}</InputLabel>
                                        <Select
                                            labelId="edit-unit-select-label"
                                            value={editFormData.unit || "L"}
                                            label={texts.units}
                                            onChange={(e) => setEditFormData({ ...editFormData, unit: e.target.value })}
                                        >
                                            <MenuItem value="L">L</MenuItem>
                                            <MenuItem value="mL">mL</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Stack>

                                {error && (
                                    <Typography color="error" variant="body2" align="center">
                                        {texts[error] || error}
                                    </Typography>
                                )}
                            </Box>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setEditDialogOpen(false)}>{texts.cancel}</Button>
                        <Button
                            onClick={async () => {
                                setError("");


                                if (!editFormData.pump_id) return setError("selectPump");
                                if (!editFormData.clock) return setError("selectHour");
                                if (!editFormData.volume || Number(editFormData.volume) <= 0)
                                    return setError("invalidVolume");

                                let vol = Number(editFormData.volume);
                                if (editFormData.unit === "mL") vol = vol / 1000;
                                if (vol > 999.999) return setError("volumeTooHigh");


                                const conflict = programmingList.some((p) => {
                                    if (p.id === editFormData.id) return false;
                                    if (p.pump_id !== editFormData.pump_id) return false;
                                    if (p.day_of_week !== editFormData.day_of_week) return false;


                                    const existingTime = dayjs(p.clock, "HH:mm:ss").format("HH:mm");
                                    const newTime = dayjs(editFormData.clock, "HH:mm:ss").format("HH:mm");

                                    return existingTime === newTime;
                                });
                                if (conflict) return setError("conflictProgramming");


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
                            disabled={loading || !editFormData?.pump_id || !editFormData?.day_of_week || !editFormData?.clock || !editFormData?.volume}
                        >
                            {loading ? texts.updating : texts.update}
                        </Button>
                    </DialogActions>
                </Dialog>
            </AccordionDetails>
        </Accordion>
    );
}