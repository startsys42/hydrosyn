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



export default function CreateProgrammingLight({
    lightList,
    programmingList,
    refresh,
    error,
    setError,
}) {
    const texts = useTexts();
    const navigate = useNavigate();
    const DAYS = [
        { value: "Monday", label: texts.dayMonday },
        { value: "Tuesday", label: texts.dayTuesday },
        { value: "Wednesday", label: texts.dayWednesday },
        { value: "Thursday", label: texts.dayThursday },
        { value: "Friday", label: texts.dayFriday },
        { value: "Saturday", label: texts.daySaturday },
        { value: "Sunday", label: texts.daySunday },
    ];
    const [formData, setFormData] = useState({
        light_id: "",
        day_of_week: "Monday",
        start_time: "08:00",
        end_time: "18:00",
        is_active: true,
    });
    const [loading, setLoading] = useState(false);

    const timeToMinutes = (time) => {
        const [hours, minutes] = time.split(":").map(Number);
        return hours * 60 + minutes;
    };

    const checkConflict = () => {
        const start = timeToMinutes(formData.start_time);
        const end = timeToMinutes(formData.end_time);

        if (start >= end) return "La hora de inicio debe ser menor que la hora de fin";

        const conflict = programmingList.find(p =>
            p.light_id === formData.light_id &&
            p.day_of_week === formData.day_of_week &&
            (
                (start >= timeToMinutes(p.start_time) && start < timeToMinutes(p.end_time)) ||
                (end > timeToMinutes(p.start_time) && end <= timeToMinutes(p.end_time)) ||
                (start <= timeToMinutes(p.start_time) && end >= timeToMinutes(p.end_time))
            )
        );

        if (conflict) return `Superposición: ya existe programación de ${conflict.start_time} a ${conflict.end_time}`;
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!formData.light_id) return setError("Selecciona una luz");
        const conflictMsg = checkConflict();
        if (conflictMsg) return setError(conflictMsg);

        setLoading(true);
        try {
            const { data: sessionData } = await supabase.auth.getSession();
            if (!sessionData?.session) {
                navigate("/dashboard", { replace: true });
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

            setFormData({
                light_id: "",
                day_of_week: "Monday",
                start_time: "08:00",
                end_time: "18:00",
                is_active: true,
            });

            refresh();
        } catch (err) {
            setError(err.message || "Error al crear");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <h3>{texts.createProgrammingLight}</h3>
            </AccordionSummary>
            <AccordionDetails>
                <form onSubmit={handleSubmit} className="form-container">
                    <label>Luz</label>
                    <select
                        value={formData.light_id}
                        onChange={(e) => setFormData({ ...formData, light_id: e.target.value })}
                        disabled={loading}
                    >
                        <option value="" disabled>Selecciona una luz</option>
                        {lightList.map(l => (
                            <option key={l.id} value={l.id}>{l.name} (GPIO {l.gpio})</option>
                        ))}
                    </select>

                    <label>Día</label>
                    <select
                        value={formData.day_of_week}
                        onChange={(e) => setFormData({ ...formData, day_of_week: e.target.value })}
                        disabled={loading}
                    >
                        {DAYS_OF_WEEK.map(d => (
                            <option key={d.value} value={d.value}>{d.label}</option>
                        ))}
                    </select>

                    <label>Hora inicio</label>
                    <input
                        type="time"
                        value={formData.start_time}
                        onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                        required
                    />

                    <label>Hora fin</label>
                    <input
                        type="time"
                        value={formData.end_time}
                        onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                        required
                    />

                    <label>
                        <input
                            type="checkbox"
                            checked={formData.is_active}
                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        /> Activar programación
                    </label>

                    <button type="submit" disabled={loading}>
                        {loading ? "Guardando..." : "Guardar"}
                    </button>

                    {error && <p style={{ color: "red" }}>{error}</p>}
                </form>
            </AccordionDetails>
        </Accordion>
    );
}