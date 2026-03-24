// PumpComponents/UpdateProgrammingPump.jsx
import { useState, useEffect } from "react";
import { supabase } from "../../utils/supabaseClient";
import { useNavigate } from "react-router-dom";
import '../../styles/theme.css';
import useTexts from "../../utils/UseTexts";

const DAYS = [
    { value: "monday", label: texts.dayMonday },
    { value: "tuesday", label: texts.dayTuesday },
    { value: "wednesday", label: texts.dayWednesday },
    { value: "thursday", label: texts.dayThursday },
    { value: "friday", label: texts.dayFriday },
    { value: "saturday", label: texts.daySaturday },
    { value: "sunday", label: texts.daySunday },
];

export default function UpdateProgrammingPump({ pumpList, programmingList, refresh, error, setError }) {
    const texts = useTexts();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [selectedProgramming, setSelectedProgramming] = useState("");
    const [formData, setFormData] = useState({
        id: null,
        pump_id: "",
        day_of_week: "monday",
        clock: "12:00",
        volume: 0,
    });

    // Actualiza formData al seleccionar una programación
    useEffect(() => {
        if (!selectedProgramming) return;
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
    }, [selectedProgramming, programmingList]);

    const checkConflict = (pumpId, day, time, excludeId) => {
        const conflict = programmingList.find(p =>
            p.pump_id === pumpId &&
            p.day_of_week === day &&
            p.id !== excludeId &&
            p.clock === time
        );
        return conflict ? { conflicts: true, message: `Ya existe programación a las ${time}` } : { conflicts: false };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        if (!formData.pump_id) return setError("selectPump");
        if (!formData.clock) return setError("selectHour");
        if (!formData.volume || formData.volume <= 0) return setError("invalidVolume");

        const { conflicts, message } = checkConflict(
            formData.pump_id,
            formData.day_of_week,
            `${formData.clock}:00`,
            formData.id
        );
        if (conflicts) return setError(message);

        try {
            setLoading(true);
            const { data: sessionData } = await supabase.auth.getSession();
            if (!sessionData?.session) return navigate("/dashboard", { replace: true });

            const { error } = await supabase
                .from("programming_pumps")
                .update({
                    pump: formData.pump_id,
                    day_of_week: formData.day_of_week,
                    clock: `${formData.clock}:00`,
                    volume: parseFloat(formData.volume),
                })
                .eq("id", formData.id);

            if (error) throw error;

            // Reset
            setSelectedProgramming("");
            setFormData({ id: null, pump_id: "", day_of_week: "monday", clock: "12:00", volume: 0 });
            refresh();
        } catch (err) {
            setError(err.message || "Error al actualizar");
        } finally {
            setLoading(false);
        }
    };

    const getProgrammingLabel = (prog) => {
        const pump = pumpList.find(p => p.id === prog.pump_id);
        const day = DAYS.find(d => d.value === prog.day_of_week);
        return `${pump?.name || "Bomba"} - ${day?.label || prog.day_of_week} ${prog.clock.substring(0, 5)}`;
    };

    return (
        <div className="accordion">
            <div className="accordion-summary">
                <h3>{texts.updateProgramming || "Actualizar Programación"}</h3>
            </div>
            <div className="accordion-details">
                {error && <p style={{ color: "red" }}>{texts[error] || error}</p>}

                <form className="form-container" onSubmit={handleSubmit}>
                    <label>Seleccionar Programación</label>
                    <select value={selectedProgramming} onChange={e => setSelectedProgramming(Number(e.target.value))}>
                        <option value="" disabled>{texts.selectProgramming}</option>
                        {programmingList.map(p => (
                            <option key={p.id} value={p.id}>{getProgrammingLabel(p)}</option>
                        ))}
                    </select>

                    {selectedProgramming && <>
                        <label>Bomba</label>
                        <select value={formData.pump_id} onChange={e => setFormData({ ...formData, pump_id: Number(e.target.value) })}>
                            <option value="" disabled>{texts.selectPump}</option>
                            {pumpList.map(p => (
                                <option key={p.id} value={p.id}>{p.name} ({p.origin?.name} → {p.destination?.name})</option>
                            ))}
                        </select>

                        <label>Día</label>
                        <select value={formData.day_of_week} onChange={e => setFormData({ ...formData, day_of_week: e.target.value })}>
                            {DAYS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                        </select>

                        <label>Hora</label>
                        <input type="time" value={formData.clock} onChange={e => setFormData({ ...formData, clock: e.target.value })} />

                        <label>Volumen (m³)</label>
                        <input type="number" step="0.001" min="0.001" max="999.999999"
                            value={formData.volume} onChange={e => setFormData({ ...formData, volume: e.target.value })} />

                        <button type="submit" disabled={loading}>
                            {loading ? texts.updating : texts.update}
                        </button>
                    </>}
                </form>
            </div>
        </div>
    );
}