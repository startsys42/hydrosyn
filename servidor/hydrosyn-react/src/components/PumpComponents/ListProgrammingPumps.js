// PumpComponents/ListProgrammingPumps.jsx
import { useState } from "react";
import { supabase } from "../../utils/supabaseClient";
import {
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Box,
    Alert,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Delete as DeleteIcon } from "@mui/icons-material";
import { DataGrid } from "@mui/x-data-grid";
import useTexts from "../../utils/UseTexts";
import { useNavigate } from "react-router-dom";

export default function ListProgrammingPumps({
    pumpList,
    programmingList,
    refresh,
    error,
    setError,
    userRole,
}) {
    const texts = useTexts();
    const navigate = useNavigate();
    const [pageSize, setPageSize] = useState(10);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedProgramming, setSelectedProgramming] = useState(null);
    const [loading, setLoading] = useState(false);

    const getPumpName = (pumpId) => {
        const pump = pumpList.find((p) => p.id === pumpId);
        return pump ? pump.name : "Bomba no encontrada";
    };

    const getDayLabel = (dayValue) => {
        const days = {
            monday: "Lunes", tuesday: "Martes", wednesday: "Miércoles",
            thursday: "Jueves", friday: "Viernes", saturday: "Sábado", sunday: "Domingo",
        };
        return days[dayValue] || dayValue;
    };

    const formatTime = (time) => time.substring(0, 5);

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
            setError(err.message || "Error al eliminar");
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        { field: "pumpName", headerName: "Bomba", width: 200, sortable: true },
        { field: "day", headerName: "Día", width: 120, sortable: true },
        { field: "time", headerName: "Hora", width: 100, sortable: true },
        {
            field: "volume",
            headerName: "Volumen (m³)",
            width: 130,
            sortable: true,
            renderCell: (params) => params.value.toFixed(3),
        },
    ];

    // Solo owner puede ver el botón eliminar
    if (userRole === "owner") {
        columns.push({
            field: "actions",
            headerName: "Acciones",
            width: 100,
            sortable: false,
            renderCell: (params) => (
                <IconButton size="small" onClick={() => handleDeleteClick(params.row.originalData)} color="error">
                    <DeleteIcon />
                </IconButton>
            ),
        });
    }

    const rows = programmingList.map((prog) => ({
        id: prog.id,
        pumpName: getPumpName(prog.pump_id),
        day: getDayLabel(prog.day_of_week),
        time: formatTime(prog.clock),
        volume: prog.volume,
        originalData: prog,
    }));

    return (
        <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <h3>{texts.listProgramming || "Lista de Programaciones"}</h3>
            </AccordionSummary>
            <AccordionDetails>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {programmingList.length === 0 ? (
                    <Alert severity="info">No hay programaciones configuradas</Alert>
                ) : (
                    <Box sx={{ height: 400, width: "100%" }}>
                        <DataGrid
                            rows={rows}
                            columns={columns}
                            pageSize={pageSize}
                            onPageSizeChange={setPageSize}
                            rowsPerPageOptions={[5, 10, 25]}
                            disableSelectionOnClick
                            autoHeight
                        />
                    </Box>
                )}

                {/* Diálogo de eliminar */}
                <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                    <DialogTitle>Confirmar eliminación</DialogTitle>
                    <DialogContent>
                        <Typography>¿Estás seguro de eliminar esta programación?</Typography>
                        {selectedProgramming && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                <strong>Bomba:</strong> {getPumpName(selectedProgramming.pump_id)}<br />
                                <strong>Día:</strong> {getDayLabel(selectedProgramming.day_of_week)}<br />
                                <strong>Hora:</strong> {formatTime(selectedProgramming.clock)}<br />
                                <strong>Volumen:</strong> {selectedProgramming.volume} m³
                            </Typography>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleDeleteConfirm} variant="contained" color="error" disabled={loading}>
                            {loading ? "Eliminando..." : "Eliminar"}
                        </Button>
                    </DialogActions>
                </Dialog>
            </AccordionDetails>
        </Accordion>
    );
}