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
    Switch,
    FormControlLabel,
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

export default function CreateProgrammingLight({
    lightList,
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
        light_id: "",
        day_of_week: "monday",
        start_time: "08:00",
        end_time: "18:00",
        is_active: true,
    });

    const timeToMinutes = (time) => {
        const [hours, minutes] = time.split(":").map(Number);
        return hours * 60 + minutes;
    };

    const checkOverlap = (lightId, day, start, end) => {
        const startMinutes = timeToMinutes(start);
        const endMinutes = timeToMinutes(end);

        if (startMinutes >= endMinutes) {
            return {
                overlaps: true,
                message: "La hora de inicio debe ser menor que la hora de fin",
            };
        }

        const conflicting = programmingList.find((prog) => {
            if (prog.light_id !== lightId) return false;
            if (prog.day_of_week !== day) return false;

            const existingStart = timeToMinutes(prog.start_time);
            const existingEnd = timeToMinutes(prog.end_time);

            return (
                (startMinutes >= existingStart && startMinutes < existingEnd) ||
                (endMinutes > existingStart && endMinutes <= existingEnd) ||
                (startMinutes <= existingStart && endMinutes >= existingEnd)
            );
        });

        if (conflicting) {
            return {
                overlaps: true,
                message: `Superposición: ya existe programación de ${conflicting.start_time} a ${conflicting.end_time}`,
            };
        }

        return { overlaps: false };
    };

    const handleSubmit = async () => {
        if (!formData.light_id) {
            setError("Selecciona una luz");
            return;
        }

        const { overlaps, message } = checkOverlap(
            formData.light_id,
            formData.day_of_week,
            formData.start_time,
            formData.end_time
        );

        if (overlaps) {
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

            const { error } = await supabase.from("programming_lights").insert({
                light: formData.light_id,
                day_of_week: formData.day_of_week,
                start_time: `${formData.start_time}:00`,
                end_time: `${formData.end_time}:00`,
                is_active: formData.is_active,
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
            light_id: lightList[0]?.id || "",
            day_of_week: "monday",
            start_time: "08:00",
            end_time: "18:00",
            is_active: true,
        });
        setError(null);
    };

    return (
        <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <h3>{texts.createProgramming || "Crear Programación de Luz"}</h3>
            </AccordionSummary>
            <AccordionDetails>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={() => setOpen(true)}
                    disabled={lightList.length === 0}
                >
                    {texts.addProgramming || "Nueva Programación"}
                </Button>

                <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
                    <DialogTitle>Programar Luz</DialogTitle>
                    <DialogContent>
                        {error && (
                            <Alert severity="error" sx={{ mb: 2, mt: 1 }}>
                                {error}
                            </Alert>
                        )}
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12}>
                                <FormControl fullWidth>
                                    <InputLabel>Luz</InputLabel>
                                    <Select
                                        value={formData.light_id}
                                        onChange={(e) => setFormData({ ...formData, light_id: e.target.value })}
                                        label="Luz"
                                    >
                                        {lightList.map((light) => (
                                            <MenuItem key={light.id} value={light.id}>
                                                {light.name} (GPIO {light.gpio})
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
                                    label="Hora inicio"
                                    type="time"
                                    value={formData.start_time}
                                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>

                            <Grid item xs={6}>
                                <TextField
                                    fullWidth
                                    label="Hora fin"
                                    type="time"
                                    value={formData.end_time}
                                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={formData.is_active}
                                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                        />
                                    }
                                    label="Activar programación"
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