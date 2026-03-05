import { useState } from "react";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Button, TextField, MenuItem, Select, InputLabel, FormControl } from "@mui/material";
import { supabase } from "../../utils/supabaseClient";
import texts from "../../i18n/locales";
import useTexts from "../../utils/UseTexts";

export default function ProgrammingPump({ systemId, pumpList, programmingList, refresh, error, setError }) {
    const [editing, setEditing] = useState(null); // fila en edición
    const [pump, setPump] = useState("");
    const [day, setDay] = useState("");
    const [clock, setClock] = useState("");
    const [volume, setVolume] = useState("");
    const texts = useTexts();

    const daysOfWeek = [
        { value: "mon", label: "Lunes" },
        { value: "tue", label: "Martes" },
        { value: "wed", label: "Miércoles" },
        { value: "thu", label: "Jueves" },
        { value: "fri", label: "Viernes" },
        { value: "sat", label: "Sábado" },
        { value: "sun", label: "Domingo" },
    ];

    // ---------- AÑADIR NUEVA PROGRAMACIÓN ----------
    const handleAdd = async (e) => {
        e.preventDefault();
        setError("");
        if (!pump || !day || !clock || !volume) return setError("Completa todos los campos");

        try {
            const { error: insertError } = await supabase
                .from("programming_pumps")
                .insert({
                    pump: parseInt(pump),
                    day_of_week: day,
                    clock,
                    volume: parseFloat(volume),
                });
            if (insertError) throw insertError;
            resetForm();
            refresh();
        } catch (err) {
            setError(err.message || "Error al añadir programación");
        }
    };

    // ---------- BORRAR PROGRAMACIÓN ----------
    const handleDelete = async (id) => {
        if (!window.confirm("¿Seguro que quieres borrar esta programación?")) return;
        try {
            const { error: deleteError } = await supabase
                .from("programming_pumps")
                .delete()
                .eq("id", id);
            if (deleteError) throw deleteError;
            refresh();
        } catch (err) {
            setError(err.message || "Error al borrar programación");
        }
    };

    // ---------- INICIAR EDICIÓN ----------
    const handleEdit = (program) => {
        setEditing(program);
        setPump(program.pump.id);
        setDay(program.day_of_week);
        setClock(program.clock);
        setVolume(program.volume);
    };

    // ---------- ACTUALIZAR PROGRAMACIÓN ----------
    const handleUpdate = async (e) => {
        e.preventDefault();
        setError("");
        if (!pump || !day || !clock || !volume) return setError("Completa todos los campos");

        try {
            const { error: updateError } = await supabase
                .from("programming_pumps")
                .update({
                    pump: parseInt(pump),
                    day_of_week: day,
                    clock,
                    volume: parseFloat(volume),
                })
                .eq("id", editing.id);

            if (updateError) throw updateError;
            resetForm();
            setEditing(null);
            refresh();
        } catch (err) {
            setError(err.message || "Error al actualizar programación");
        }
    };

    const resetForm = () => {
        setPump("");
        setDay("");
        setClock("");
        setVolume("");
        setEditing(null);
    };

    return (
        <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <h3>{texts.programs}</h3>
            </AccordionSummary>
            <AccordionDetails>
                {error && <p style={{ color: "red" }}>{error}</p>}

                {/* LISTA DE PROGRAMACIONES */}
                <ul>
                    {programmingList.map((p) => (
                        <li key={p.id}>
                            <strong>{p.pump.name}</strong> - {p.day_of_week} - {p.clock} - {p.volume} L
                            <Button onClick={() => handleEdit(p)} size="small" variant="outlined" style={{ marginLeft: 5 }}>
                                Editar
                            </Button>
                            <Button onClick={() => handleDelete(p.id)} size="small" variant="outlined" color="error" style={{ marginLeft: 5 }}>
                                Borrar
                            </Button>
                        </li>
                    ))}
                </ul>

                {/* FORMULARIO DE AÑADIR / EDITAR */}
                <form onSubmit={editing ? handleUpdate : handleAdd} style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
                    <FormControl fullWidth>
                        <InputLabel id="pump-label">Bomba</InputLabel>
                        <Select labelId="pump-label" value={pump} onChange={(e) => setPump(e.target.value)} required>
                            {pumpList.map((p) => (
                                <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl fullWidth>
                        <InputLabel id="day-label">Día</InputLabel>
                        <Select labelId="day-label" value={day} onChange={(e) => setDay(e.target.value)} required>
                            {daysOfWeek.map((d) => (
                                <MenuItem key={d.value} value={d.value}>{d.label}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <TextField
                        label="Hora"
                        type="time"
                        value={clock}
                        onChange={(e) => setClock(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        required
                    />

                    <TextField
                        label="Volumen (L)"
                        type="number"
                        step="0.000001"
                        min="0.000001"
                        max="999.999999"
                        value={volume}
                        onChange={(e) => setVolume(e.target.value)}
                        required
                    />

                    <Button type="submit" variant="contained" color="primary">
                        {editing ? "Actualizar" : "Añadir"}
                    </Button>

                    {editing && (
                        <Button type="button" variant="outlined" color="secondary" onClick={resetForm}>
                            Cancelar
                        </Button>
                    )}
                </form>
            </AccordionDetails>
        </Accordion>
    );
}
