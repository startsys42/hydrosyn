import { useState } from "react";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import useTexts from "../../utils/UseTexts";
import { supabase } from "../../utils/supabaseClient";
import { useNavigate } from "react-router-dom";
import '../../styles/theme.css';

export default function CreateProgrammingPump({
    pumpList,
    programmingList,
    refresh,
    error,
    setError
}) {

    const texts = useTexts();
    const navigate = useNavigate();

    const [selectedPump, setSelectedPump] = useState("");
    const [day, setDay] = useState("monday");
    const [hour, setHour] = useState("");
    const [volume, setVolume] = useState("");
    const [loading, setLoading] = useState(false);

    const DAYS = [
        { value: "monday", label: "Lunes" },
        { value: "tuesday", label: "Martes" },
        { value: "wednesday", label: "Miércoles" },
        { value: "thursday", label: "Jueves" },
        { value: "friday", label: "Viernes" },
        { value: "saturday", label: "Sábado" },
        { value: "sunday", label: "Domingo" },
    ];

    const checkConflict = () => {
        return programmingList.some(p =>
            p.pump === parseInt(selectedPump) &&
            p.day_of_week === day &&
            p.clock === `${hour}:00`
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!selectedPump) return setError("selectPump");
        if (!hour) return setError("selectHour");
        if (!volume) return setError("invalidVolume");

        let vol = parseFloat(volume);
        if (vol <= 0) return setError("invalidVolume");
        if (vol > 999.999999) return setError("volumeTooHigh");

        if (checkConflict()) {
            setError("conflictProgramming");
            return;
        }

        try {
            setLoading(true);

            const { data: sessionData } = await supabase.auth.getSession();
            if (!sessionData?.session) {
                navigate("/dashboard", { replace: true });
                return;
            }

            const { error } = await supabase
                .from("programming_pumps")
                .insert({
                    pump: parseInt(selectedPump),
                    day_of_week: day,
                    clock: `${hour}:00`,
                    volume: vol
                });

            if (error) throw error;

            setSelectedPump("");
            setDay("monday");
            setHour("");
            setVolume("");

            refresh();

        } catch (err) {
            setError("Error" || err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <h3>{texts.createProgrammingPump}</h3>
            </AccordionSummary>

            <AccordionDetails>
                <form onSubmit={handleSubmit} className='form-container'>

                    <label>{texts.selectPump}</label>
                    <select
                        value={selectedPump}
                        onChange={(e) => setSelectedPump(e.target.value)}
                        disabled={loading}
                    >
                        <option value="" disabled>{texts.selectPump}</option>
                        {pumpList.map(p => (
                            <option key={p.id} value={p.id}>
                                {p.name}
                            </option>
                        ))}
                    </select>

                    <label>{texts.day}</label>
                    <select
                        value={day}
                        onChange={(e) => setDay(e.target.value)}
                        disabled={loading}
                    >
                        {DAYS.map(d => (
                            <option key={d.value} value={d.value}>
                                {d.label}
                            </option>
                        ))}
                    </select>

                    <label>{texts.hour}</label>
                    <input
                        type="time"
                        value={hour}
                        onChange={(e) => setHour(e.target.value)}
                        disabled={loading}
                        required
                    />

                    <label>{texts.volume}</label>
                    <input
                        type="number"
                        step="0.000001"
                        min="0.000001"
                        max="999.999999"
                        value={volume}
                        onChange={(e) => setVolume(e.target.value)}
                        disabled={loading}
                        required
                    />

                    <button type="submit" disabled={loading}>
                        {loading ? texts.creating : texts.createProgramming}
                    </button>

                    {error && (
                        <p style={{ color: "red" }}>
                            {texts[error] || error}
                        </p>
                    )}

                </form>
            </AccordionDetails>
        </Accordion>
    );
}