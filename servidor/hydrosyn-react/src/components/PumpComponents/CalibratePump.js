import { useState } from "react";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import useTexts from "../../utils/UseTexts";
import { supabase } from "../../utils/supabaseClient";
import { useNavigate } from "react-router-dom";

export default function CalibratePump({ systemId, pumpList, refresh, error, setError }) {
    const texts = useTexts();
    const navigate = useNavigate();

    const [selectedPump, setSelectedPump] = useState("");
    const [volume, setVolume] = useState("");
    const [unit, setUnit] = useState("l");
    const [loading, setLoading] = useState(false);

    const checkUserActive = async () => {
        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData?.session?.user;
        if (!user) return null;

        const { data: adminData } = await supabase
            .from("admin_users")
            .select("*")
            .eq("user", user.id)
            .eq("is_active", true)
            .maybeSingle();

        const { data: systemUserData } = await supabase
            .from("systems_users")
            .select("*")
            .eq("system", systemId)
            .eq("user_id", user.id)
            .eq("is_active", true)
            .maybeSingle();

        if (!adminData && !systemUserData) return null;
        return user.id;
    };

    const handleInsertCalibrate = async () => {
        setError("");
        if (!selectedPump || !volume) return setError(texts.selectPump);
        setLoading(true);

        try {
            const userId = await checkUserActive();
            if (!userId) return navigate("/dashboard", { replace: true });

            let vol = parseFloat(volume);
            if (unit === "ml") vol = vol / 1000;
            if (vol <= 0 || vol > 999.999999) {
                setError(texts.invalidVolume);
                return;
            }

            const { error: insertError } = await supabase
                .from("calibrate")
                .insert({ pump: parseInt(selectedPump), user: userId, volume: vol });

            if (insertError) throw insertError;
            setVolume("");
            refresh();
        } catch (err) {
            setError(err.message || "Error");
        } finally {
            setLoading(false);
        }
    };

    const handleInsertCalibration = async () => {
        setError("");
        if (!selectedPump || !volume) return setError(texts.selectPump);
        setLoading(true);

        try {
            const userId = await checkUserActive();
            if (!userId) return navigate("/dashboard", { replace: true });

            let vol = parseFloat(volume);
            if (unit === "ml") vol = vol / 1000;
            if (vol <= 0 || vol > 999.999999) {
                setError(texts.invalidVolume);
                return;
            }

            const { error: insertError } = await supabase
                .from("calibration")
                .insert({ pump: parseInt(selectedPump), user: userId, volume: vol, success: false });

            if (insertError) throw insertError;
            setVolume("");
            refresh();
        } catch (err) {
            setError(err.message || "Error ");
        } finally {
            setLoading(false);
        }
    };


    return (
        <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <h3>{texts.calibratePump}</h3>
            </AccordionSummary>
            <AccordionDetails>
                <form onSubmit={(e) => e.preventDefault()} className='form-container'>

                    <label htmlFor="select-pump">{texts.selectPump}</label>
                    <select id="select-pump"
                        value={selectedPump || ''}
                        onChange={(e) => setSelectedPump(e.target.value)}
                    >
                        <option value='' disabled>{texts.selectPump}</option>
                        {pumpList.map(pump => (
                            <option key={pump.id} value={pump.id}>{pump.name}</option>
                        ))}
                    </select>

                    <label htmlFor="calibration-volume">
                        {texts.calibrationVolume}
                    </label>
                    <input
                        id="calibration-volume"
                        type="number"
                        step="0.000001"
                        min="0.000001"
                        max="999.999999"
                        value={volume}
                        onChange={(e) => setVolume(e.target.value)}
                        placeholder="Ej: 100.5"
                        disabled={loading}
                        required
                    />

                    {/* SELECTOR DE UNIDAD */}
                    <label>Unidad:</label>
                    <select
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                        disabled={loading}
                    >
                        <option value="ml">ml</option>
                        <option value="l">L</option>
                    </select>


                    <button onClick={handleInsertCalibrate} disabled={loading}>
                        {loading ? "Procesando..." : "Guardar en calibrate"}
                    </button>

                    <button onClick={handleInsertCalibration} disabled={loading}>
                        {loading ? "Procesando..." : "Guardar en calibration"}
                    </button>



                </form>
                {error && <p style={{ color: 'red' }}>{texts[error] || error}</p>}

            </AccordionDetails>
        </Accordion>
    );
}