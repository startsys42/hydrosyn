import { useState, useEffect } from "react";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { supabase } from "../../utils/supabaseClient";
import { useNavigate } from "react-router-dom";
import useTexts from "../../utils/UseTexts";
import '../../styles/theme.css';

export default function UpdateProgrammingPump({
    pumpList,
    programmingList,
    refresh,
    error,
    setError
}) {
    const texts = useTexts();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [selectedProgramming, setSelectedProgramming] = useState("");
    const [unit, setUnit] = useState("l");

    const [formData, setFormData] = useState({
        id: null,
        pump_id: "",
        day_of_week: "monday",
        clock: "12:00",
        volume: "",
    });

    const DAYS = [
        { value: "monday", label: texts.dayMonday },
        { value: "tuesday", label: texts.dayTuesday },
        { value: "wednesday", label: texts.dayWednesday },
        { value: "thursday", label: texts.dayThursday },
        { value: "friday", label: texts.dayFriday },
        { value: "saturday", label: texts.daySaturday },
        { value: "sunday", label: texts.daySunday },
    ];

    useEffect(() => {
        if (!selectedProgramming) return;

        const prog = programmingList.find(p => p.id === selectedProgramming);

        if (prog) {
            setFormData({
                id: prog.id,
                pump_id: prog.pump,
                day_of_week: prog.day_of_week,
                clock: prog.clock.substring(0, 5),
                volume: prog.volume,
            });
        }
    }, [selectedProgramming, programmingList]);

    const checkConflict = (pumpId, day, time, excludeId) => {
        return programmingList.some(p =>
            p.pump === pumpId &&
            p.day_of_week === day &&
            p.id !== excludeId &&
            p.clock === time
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!formData.pump_id) return setError("selectPump");
        if (!formData.clock) return setError("selectHour");
        if (!formData.volume) return setError("invalidVolume");

        let vol = parseFloat(formData.volume);
        if (unit === "ml") vol = vol / 1000;

        if (vol <= 0) return setError("invalidVolume");
        if (vol > 999.999999) return setError("volumeTooHigh");

        if (checkConflict(formData.pump_id, formData.day_of_week, `${formData.clock}:00`, formData.id)) {
            return setError("conflictProgramming");
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
                .update({
                    pump: formData.pump_id,
                    day_of_week: formData.day_of_week,
                    clock: `${formData.clock}:00`,
                    volume: vol,
                })
                .eq("id", formData.id);

            if (error) throw error;

            setSelectedProgramming("");
            setFormData({
                id: null,
                pump_id: "",
                day_of_week: "monday",
                clock: "12:00",
                volume: "",
            });
            setUnit("l");

            refresh();

        } catch (err) {
            setError(err.message || "Error");
        } finally {
            setLoading(false);
        }
    };

    const getProgrammingLabel = (prog) => {
        const pump = pumpList.find(p => p.id === prog.pump);
        const day = DAYS.find(d => d.value === prog.day_of_week);

        return `${pump?.name || "Pump"} - ${day?.label} ${prog.clock.substring(0, 5)}`;
    };

    return (
        <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <h3>{texts.updateProgrammingPump}</h3>
            </AccordionSummary>

            <AccordionDetails>
                <form onSubmit={handleSubmit} className="form-container">

                    {error && <p style={{ color: "red" }}>{texts[error] || error}</p>}

                    <label>{texts.selectProgramming}</label>
                    <select value={selectedProgramming} onChange={(e) => setSelectedProgramming(Number(e.target.value))}>
                        <option value="" disabled>{texts.selectProgramming}</option>
                        {programmingList.map(p => (
                            <option key={p.id} value={p.id}>
                                {getProgrammingLabel(p)}
                            </option>
                        ))}
                    </select>

                    {selectedProgramming && <>
                        <label>{texts.selectPump}</label>
                        <select
                            value={formData.pump_id}
                            onChange={(e) => setFormData({ ...formData, pump_id: Number(e.target.value) })}
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
                            value={formData.day_of_week}
                            onChange={(e) => setFormData({ ...formData, day_of_week: e.target.value })}
                        >
                            {DAYS.map(d => (
                                <option key={d.value} value={d.value}>{d.label}</option>
                            ))}
                        </select>

                        <label>{texts.hour}</label>
                        <input
                            type="time"
                            value={formData.clock}
                            onChange={(e) => setFormData({ ...formData, clock: e.target.value })}
                        />

                        <label>{texts.volume}</label>
                        <input
                            type="number"
                            value={formData.volume}
                            onChange={(e) => setFormData({ ...formData, volume: e.target.value })}
                        />

                        <label>{texts.units}</label>
                        <select value={unit} onChange={(e) => setUnit(e.target.value)}>
                            <option value="l">L</option>
                            <option value="ml">ml</option>
                        </select>

                        <button type="submit" disabled={loading}>
                            {loading ? texts.updating : texts.update}
                        </button>
                    </>}
                </form>
            </AccordionDetails>
        </Accordion>
    );
}