
import { useState } from "react";
import { supabase } from "../../utils/supabaseClient";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { DataGrid } from "@mui/x-data-grid";
import { IconButton, Dialog, DialogActions, DialogContent, DialogTitle, Button } from "@mui/material";
import { Delete as DeleteIcon, Edit as EditIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import useTexts from "../../utils/UseTexts";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import dayjs from "dayjs";

export default function ListProgrammingLights({ lightList, programmingList, refresh, error, setError, userRole }) {
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

    const getLightName = (id) => {
        const l = lightList.find(light => light.id === id);
        return l ? l.name : "-";
    };

    const formatTime = (time) => time?.substring(0, 5) || "--:--";

    const handleDeleteClick = (prog) => {
        setSelectedProgramming(prog);
        setDeleteDialogOpen(true);
    };

    const handleEditClick = (prog) => {
        setEditFormData({ ...prog });
        setEditDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!selectedProgramming) return;
        setLoading(true);
        try {
            const { data: sessionData } = await supabase.auth.getSession();
            if (!sessionData?.session) { navigate("/dashboard"); return; }

            const { error } = await supabase
                .from("programming_lights")
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

    const handleEditConfirm = async () => {
        if (!editFormData) return;
        setLoading(true);
        try {
            const { error } = await supabase
                .from("programming_lights")
                .update({
                    light: editFormData.light_id,
                    day_of_week: editFormData.day_of_week,
                    start_time: editFormData.start_time,
                    end_time: editFormData.end_time,
                    is_active: editFormData.is_active,
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

    const columns = [
        { field: "lightName", headerName: texts.lights, flex: 1, minWidth: 150 },
        { field: "day", headerName: texts.days, flex: 1, minWidth: 120 },
        { field: "startTime", headerName: texts.startTime, flex: 1, minWidth: 100 },
        { field: "endTime", headerName: texts.endTime, flex: 1, minWidth: 100 },
        { field: "is_active", headerName: texts.status, flex: 1, minWidth: 100, renderCell: (p) => p.value ? "Activo" : "Inactivo" },
    ];

    if (userRole === "owner") {
        columns.push({
            field: "delete", headerName: texts.delete, width: 80, sortable: false,
            renderCell: (params) => <IconButton size="small" color="error" onClick={() => handleDeleteClick(params.row.originalData)}><DeleteIcon /></IconButton>
        });
        columns.push({
            field: "edit", headerName: texts.update, width: 80, sortable: false,
            renderCell: (params) => <IconButton size="small" color="primary" onClick={() => handleEditClick(params.row.originalData)}><EditIcon /></IconButton>
        });
    }

    const rows = programmingList.map(p => ({
        id: p.id,
        lightName: getLightName(p.light_id),
        day: DAYS.find(d => d.value === p.day_of_week)?.label || p.day_of_week,
        startTime: formatTime(p.start_time),
        endTime: formatTime(p.end_time),
        is_active: p.is_active,
        originalData: p
    }));

    return (
        <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}><h3>{texts.listProgrammingLight}</h3></AccordionSummary>
            <AccordionDetails>
                <div style={{ height: 500, width: "100%" }}>
                    <DataGrid
                        rows={rows}
                        columns={columns}
                        pageSize={pageSize}
                        onPageSizeChange={setPageSize}
                        disableSelectionOnClick
                        loading={loading}
                    />
                </div>

                {error && <p style={{ color: "red" }}>{error}</p>}

                {/* Dialogo de borrar */}
                <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                    <DialogTitle>{texts.confirmation}</DialogTitle>
                    <DialogContent>
                        {selectedProgramming && `¿Eliminar programación de ${getLightName(selectedProgramming.light_id)} el ${selectedProgramming.day_of_week}?`}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setDeleteDialogOpen(false)}>{texts.no}</Button>
                        <Button onClick={handleDeleteConfirm} disabled={loading} variant="contained" color="error">
                            {loading ? texts.deleting : texts.yes}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Dialogo de editar */}
                <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
                    <DialogTitle>{texts.updateProgrammingLight}</DialogTitle>
                    <DialogContent>
                        {editFormData && (
                            <form>
                                <label>{texts.selectLight}</label>
                                <select value={editFormData.light_id} onChange={(e) => setEditFormData({ ...editFormData, light_id: e.target.value })}>
                                    {lightList.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                </select>
                                <label>{texts.days}</label>
                                <select value={editFormData.day_of_week} onChange={(e) => setEditFormData({ ...editFormData, day_of_week: e.target.value })}>
                                    {DAYS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                                </select>
                                <label>{texts.startTime}</label>
                                <LocalizationProvider dateAdapter={AdapterDayjs}>
                                    <TimePicker value={dayjs(editFormData.start_time, "HH:mm:ss")} onChange={(v) => setEditFormData({ ...editFormData, start_time: v.format("HH:mm:ss") })} ampm={false} />
                                </LocalizationProvider>
                                <label>{texts.endTime}</label>
                                <LocalizationProvider dateAdapter={AdapterDayjs}>
                                    <TimePicker value={dayjs(editFormData.end_time, "HH:mm:ss")} onChange={(v) => setEditFormData({ ...editFormData, end_time: v.format("HH:mm:ss") })} ampm={false} />
                                </LocalizationProvider>
                            </form>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setEditDialogOpen(false)}>{texts.cancel}</Button>
                        <Button onClick={handleEditConfirm} disabled={loading} variant="contained">{loading ? texts.updating : texts.update}</Button>
                    </DialogActions>
                </Dialog>
            </AccordionDetails>
        </Accordion>
    );
}