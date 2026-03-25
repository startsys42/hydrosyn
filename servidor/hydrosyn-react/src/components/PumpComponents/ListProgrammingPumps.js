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

export default function ListProgrammingPumps({ pumpList, programmingList, refresh, error, setError, userRole }) {
    const texts = useTexts();
    const navigate = useNavigate();

    const [pageSize, setPageSize] = useState(10);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedProgramming, setSelectedProgramming] = useState(null);
    const [loading, setLoading] = useState(false);

    const getPumpName = (pumpId) => {
        const pump = pumpList.find(p => p.id === pumpId);
        return pump ? pump.name : "-";
    };

    const getDayLabel = (dayValue) => {
        const days = {
            monday: texts.dayMonday,
            tuesday: texts.dayTuesday,
            wednesday: texts.dayWednesday,
            thursday: texts.dayThursday,
            friday: texts.dayFriday,
            saturday: texts.daySaturday,
            sunday: texts.daySunday,
        };
        return days[dayValue] || dayValue;
    };

    const formatTime = (time) => time?.substring(0, 5) || "--:--";

    const handleDeleteClick = (programming) => {
        setSelectedProgramming(programming);
        setDeleteDialogOpen(true);
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
            setError(err.message || texts.errorDeleting);
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        { field: 'pumpName', headerName: texts.pumps, flex: 1, minWidth: 150 },
        { field: 'day', headerName: texts.day, flex: 1, minWidth: 120 },
        { field: 'time', headerName: texts.time, flex: 1, minWidth: 100 },
        { field: 'volume', headerName: texts.volume, flex: 1, minWidth: 100, renderCell: (params) => Number(params.value)?.toFixed(3) || "0.000" },
    ];

    if (userRole === 'owner') {
        columns.push({
            field: 'actions',
            headerName: texts.actions,
            width: 80,
            sortable: false,
            filterable: false,
            renderCell: (params) => (
                <IconButton size="small" color="error" onClick={() => handleDeleteClick(params.row.originalData)}>
                    <DeleteIcon />
                </IconButton>
            )
        });
    }

    const rows = programmingList.map(prog => ({
        id: prog.id,
        pumpName: prog.pump?.name || getPumpName(prog.pump_id),
        day: getDayLabel(prog.day_of_week),
        time: formatTime(prog.clock || prog.start_time),
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
                        rows={rows}
                        columns={columns}
                        pageSize={pageSize}
                        onPageSizeChange={setPageSize}
                        pagination
                        disableSelectionOnClick
                    />
                </div>

                {error && <p style={{ color: 'red' }}>{error}</p>}

                <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                    <DialogTitle>{texts.confirmation}</DialogTitle>
                    <DialogContent>
                        <Typography>
                            {texts.deleteProgrammingQuestion || "¿Estás seguro de eliminar esta programación?"}
                        </Typography>
                        {selectedProgramming && (
                            <Typography variant="body2" color="text.secondary" style={{ marginTop: 8 }}>
                                <strong>{texts.pumps}:</strong> {getPumpName(selectedProgramming.pump_id)}<br />
                                <strong>{texts.day}:</strong> {getDayLabel(selectedProgramming.day_of_week)}<br />
                                <strong>{texts.time}:</strong> {formatTime(selectedProgramming.clock)}<br />
                                <strong>{texts.volume}:</strong> {selectedProgramming.volume} m³
                            </Typography>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setDeleteDialogOpen(false)}>{texts.no}</Button>
                        <Button onClick={handleDeleteConfirm} variant="contained" color="error" disabled={loading}>
                            {loading ? texts.deleting : texts.yes}
                        </Button>
                    </DialogActions>
                </Dialog>

            </AccordionDetails>
        </Accordion>
    );
}