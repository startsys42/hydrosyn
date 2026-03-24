// PumpComponents/UpdateProgrammingPump.jsx
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

export default function UpdateProgrammingPump({
    pumpList,
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
        pump_id: "",
        day_of_week: "monday",
        clock: "12:00",
        volume: 100,
    });

    const getProgrammingLabel = (prog) => {
        const pump = pumpList.find(p => p.id === prog.pump_id);
        const day = DAYS_OF_WEEK.find(d => d.value === prog.day_of_week);
        return `${pump?.name || "Bomba"} - ${day?.label || prog.day_of_week} ${prog.clock.substring(0, 5)}`;
    };

    useEffect(() => {
        if (selectedProgramming) {
            const prog = programmingList.find(p => p.id === selectedProgramming);
            if (prog) {
                setFormData({
                    id: prog.id,
                    pump_id: prog.pump_id,
                    day_of_week: prog.day_of_week,
                    clock: prog.clock.substring(0, 5),
                    volume: prog.volume,
                });
            }
        }
    }, [selectedProgramming, programmingList]);

    const checkConflict = (pumpId, day, time, excludeId) => {
        const conflicting = programmingList.find((prog) => {
            if (prog.pump_id !== pumpId) return false;
            if (prog.day_of_week !== day) return false;
            if (prog.id === excludeId) return false;
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
            `${formData.clock}:00`,
            formData.id
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

            const { error } = await supabase
                .from("programming_pumps")
                .update({
                    pump: formData.pump_id,
                    day_of_week: formData.day_of_week,
                    clock: `${formData.clock}:00`,
                    volume: formData.volume,
                })
                .eq("id", formData.id);

            if (error) throw error;

            refresh();
            setSelectedProgramming("");
            setFormData({
                id: null,
                pump_id: "",
                day_of_week: "monday",
                clock: "12:00",
                volume: 100,
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
                <h3>{texts.updateProgramming || "Actualizar Programación"}</h3>
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