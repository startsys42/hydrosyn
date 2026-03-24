// PumpComponents/CreateProgrammingPump.jsx
import { useState } from "react";
import { supabase } from "../../utils/supabaseClient";
import {
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    Grid,
    Alert,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Add as AddIcon } from "@mui/icons-material";
import useTexts from "../../utils/UseTexts";
import { useNavigate } from "react-router-dom";

const DAYS_OF_WEEK = [
    { value: "monday", label: "Lunes" },
    { value: "tuesday", label: "Martes" },
    { value: "wednesday", label: "Miércoles" },
    { value: "thursday", label: "Jueves" },
    { value: "friday", label: "Viernes" },
    { value: "saturday", label: "Sábado" },
    { value: "sunday", label: "Domingo" },
];

export default function CreateProgrammingPump({
    pumpList,
    programmingList,
    refresh,
    error,
    setError,
}) {
    const texts = useTexts();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        pump_id: "",
        day_of_week: "monday",
        clock: "12:00",
        volume: 100,
    });

    const checkConflict = (pumpId, day, time) => {
        const conflicting = programmingList.find((prog) => {
            if (prog.pump_id !== pumpId) return false;
            if (prog.day_of_week !== day) return false;
            return prog.clock === time;
        });
        return conflicting ? { conflicts: true, message: `Ya existe programación a las ${time}` } : { conflicts: false };
    };

    const handleSubmit = async () => {
        if (!formData.pump_id) {
            setError("Selecciona una bomba");
            return;
        }

        const { conflicts, message } = checkConflict(
            formData.pump_id,
            formData.day_of_week,
            `${formData.clock}:00`
        );

        if (conflicts) {
            setError(message);
            return;
        }

        setLoading(true);
        try {
            const { data: sessionData } = await supabase.auth.getSession();
            if (!sessionData?.session) {
                navigate("/dashboard");
                return;
            }

            const { error } = await supabase.from("programming_pumps").insert({
                pump: formData.pump_id,
                day_of_week: formData.day_of_week,
                clock: `${formData.clock}:00`,
                volume: formData.volume,
            });

            if (error) throw error;

            refresh();
            handleClose();
            setError(null);
        } catch (err) {
            setError(err.message || "Error al crear");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setOpen(false);
        setFormData({
            pump_id: pumpList[0]?.id || "",
            day_of_week: "monday",
            clock: "12:00",
            volume: 100,
        });
        setError(null);
    };

    return (
        <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <h3>{texts.createProgramming || "Crear Programación de Bomba"}</h3>
            </AccordionSummary>
            <AccordionDetails>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={() => setOpen(true)}
                    disabled={pumpList.length === 0}
                >
                    {texts.addProgramming || "Nueva Programación"}
                </Button>

                <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
                    <DialogTitle>Programar Bomba</DialogTitle>
                    <DialogContent>
                        {error && (
                            <Alert severity="error" sx={{ mb: 2, mt: 1 }}>
                                {error}
                            </Alert>
                        )}
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12}>
                                <FormControl fullWidth>
                                    <InputLabel>Bomba</InputLabel>
                                    <Select
                                        value={formData.pump_id}
                                        onChange={(e) => setFormData({ ...formData, pump_id: e.target.value })}
                                        label="Bomba"
                                    >
                                        {pumpList.map((pump) => (
                                            <MenuItem key={pump.id} value={pump.id}>
                                                {pump.name} ({pump.origin?.name} → {pump.destination?.name})
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12}>
                                <FormControl fullWidth>
                                    <InputLabel>Día</InputLabel>
                                    <Select
                                        value={formData.day_of_week}
                                        onChange={(e) => setFormData({ ...formData, day_of_week: e.target.value })}
                                        label="Día"
                                    >
                                        {DAYS_OF_WEEK.map((day) => (
                                            <MenuItem key={day.value} value={day.value}>
                                                {day.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={6}>
                                <TextField
                                    fullWidth
                                    label="Hora"
                                    type="time"
                                    value={formData.clock}
                                    onChange={(e) => setFormData({ ...formData, clock: e.target.value })}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField
                                    fullWidth
                                    label="Volumen (m³)"
                                    type="number"
                                    value={formData.volume}
                                    onChange={(e) => setFormData({ ...formData, volume: parseFloat(e.target.value) })}
                                    inputProps={{ step: 0.001, min: 0.001, max: 999.999999 }}
                                />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleClose}>Cancelar</Button>
                        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
                            {loading ? "Guardando..." : "Guardar"}
                        </Button>
                    </DialogActions>
                </Dialog>
            </AccordionDetails>
        </Accordion>
    );
}