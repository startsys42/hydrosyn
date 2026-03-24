// LightComponents/UpdateProgrammingLight.jsx
import { useState, useEffect } from "react";
import { supabase } from "../../utils/supabaseClient";
import {
    Accordion,
    AccordionSummary,
    AccordionDetails,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    Grid,
    Button,
    Alert,
    Switch,
    FormControlLabel,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
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

export default function UpdateProgrammingLight({
    lightList,
    programmingList,
    refresh,
    error,
    setError,
}) {
    const texts = useTexts();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [selectedProgramming, setSelectedProgramming] = useState("");
    const [formData, setFormData] = useState({
        id: null,
        light_id: "",
        day_of_week: "monday",
        start_time: "08:00",
        end_time: "18:00",
        is_active: true,
    });

    const getProgrammingLabel = (prog) => {
        const light = lightList.find(l => l.id === prog.light_id);
        const day = DAYS_OF_WEEK.find(d => d.value === prog.day_of_week);
        return `${light?.name || "Luz"} - ${day?.label || prog.day_of_week} ${prog.start_time.substring(0, 5)}-${prog.end_time.substring(0, 5)}`;
    };

    useEffect(() => {
        if (selectedProgramming) {
            const prog = programmingList.find(p => p.id === selectedProgramming);
            if (prog) {
                setFormData({
                    id: prog.id,
                    light_id: prog.light_id,
                    day_of_week: prog.day_of_week,
                    start_time: prog.start_time.substring(0, 5),
                    end_time: prog.end_time.substring(0, 5),
                    is_active: prog.is_active,
                });
            }
        }
    }, [selectedProgramming, programmingList]);

    const timeToMinutes = (time) => {
        const [hours, minutes] = time.split(":").map(Number);
        return hours * 60 + minutes;
    };

    const checkOverlap = (lightId, day, start, end, excludeId) => {
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
            if (prog.id === excludeId) return false;

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
            formData.end_time,
            formData.id
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

            const { error } = await supabase
                .from("programming_lights")
                .update({
                    light: formData.light_id,
                    day_of_week: formData.day_of_week,
                    start_time: `${formData.start_time}:00`,
                    end_time: `${formData.end_time}:00`,
                    is_active: formData.is_active,
                })
                .eq("id", formData.id);

            if (error) throw error;

            refresh();
            setSelectedProgramming("");
            setFormData({
                id: null,
                light_id: "",
                day_of_week: "monday",
                start_time: "08:00",
                end_time: "18:00",
                is_active: true,
            });
            setError(null);
        } catch (err) {
            setError(err.message || "Error al actualizar");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <h3>{texts.updateProgramming || "Actualizar Programación de Luz"}</h3>
            </AccordionSummary>
            <AccordionDetails>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <FormControl fullWidth>
                            <InputLabel>Seleccionar Programación</InputLabel>
                            <Select
                                value={selectedProgramming}
                                onChange={(e) => setSelectedProgramming(e.target.value)}
                                label="Seleccionar Programación"
                            >
                                {programmingList.map((prog) => (
                                    <MenuItem key={prog.id} value={prog.id}>
                                        {getProgrammingLabel(prog)}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    {selectedProgramming && (
                        <>
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

                            <Grid item xs={12}>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    fullWidth
                                >
                                    {loading ? "Actualizando..." : "Actualizar"}
                                </Button>
                            </Grid>
                        </>
                    )}
                </Grid>
            </AccordionDetails>
        </Accordion>
    );
}