import { useState, useEffect } from "react";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import useTexts from "../../utils/UseTexts";
import { supabase } from "../../utils/supabaseClient";
import { useNavigate } from "react-router-dom";

export default function CreateRecord({ systemId, tankList, refresh, error, setError }) {





    const navigate = useNavigate();
    const texts = useTexts();


    const [selectedTank, setSelectedTank] = useState("");
    const [volume, setVolume] = useState("");
    const [unit, setUnit] = useState("liters");
    const [loading, setLoading] = useState(false);
    const [customDate, setCustomDate] = useState("");

    useEffect(() => {
        if (selectedTank && !tankList.find(t => t.id === parseInt(selectedTank))) {
            setSelectedTank("");
        }
    }, [tankList, selectedTank]);

    useEffect(() => {
        const init = async () => {
            const allowed = await checkAccess();

            if (!allowed) {
                navigate("/dashboard");
                return;
            }

        };

        init();
    }, [systemId]);

    // ✅ COMPROBAR ACCESO
    const checkAccess = async () => {

        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData?.session?.user;
        if (!user) return false;

        // 1️⃣ Obtener sistema
        const { data: system } = await supabase
            .from("systems")
            .select("id, admin")
            .eq("id", systemId)
            .maybeSingle();

        if (!system) return false;

        // 2️⃣ Comprobar admin activo
        const { data: adminData } = await supabase
            .from("admin_users")
            .select("is_active")
            .eq("user", system.admin)
            .maybeSingle();

        if (!adminData?.is_active) return false;

        // 3️⃣ Si soy admin → OK
        if (system.admin === user.id) return true;

        // 4️⃣ Si soy usuario activo → OK
        const { data: userRelation } = await supabase
            .from("systems_users")
            .select("is_active")
            .eq("system", systemId)
            .eq("user_id", user.id)
            .maybeSingle();

        if (userRelation?.is_active) return true;

        return false;
    };



    const handleCreateRecord = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        if (!selectedTank) {
            setError(texts.selectTank);
            setLoading(false);
            return;
        }

        if (!volume || parseFloat(volume) <= 0) {
            setError(texts.invalidVolume);
            setLoading(false);
            return;
        }
        const allowed = await checkAccess();
        if (!allowed) {

            navigate("/dashboard"); // redirigir
            return;
        }
        let volumeNum = parseFloat(volume);

        if (unit === "ml") {
            volumeNum = volumeNum / 1000;
        }

        if (volumeNum > 999.999999) {
            setError(texts.volumeTooHigh);
            setLoading(false);
            return;
        }

        try {
            const { data: sessionData } = await supabase.auth.getSession();
            const user = sessionData?.session?.user;
            if (!user) {
                navigate("/dashboard");
                return;
            }
            const recordDate = customDate ? new Date(customDate).toISOString() : null;

            // Llamada RPC
            const { error: rpcError } = await supabase.rpc('insert_record_for_system', {
                p_system_id: systemId,
                p_tank_id: parseInt(selectedTank),
                p_user: user.id,
                p_volume: volumeNum,
                p_created_at: recordDate
            });

            if (rpcError) throw rpcError;

            setSelectedTank("");
            setVolume("");
            setUnit("liters");

            if (refresh) await refresh();

        } catch (err) {
            setError(err.message || "Error");
        } finally {
            setLoading(false);
        }
    };
    return (
        <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <h3>{texts.addRecord}</h3>
            </AccordionSummary>
            <AccordionDetails>
                <form onSubmit={handleCreateRecord} className='form-container'>

                    {/* SELECTOR DE TANQUES */}
                    <label>{texts.selectTank}</label>
                    <select
                        value={selectedTank}
                        onChange={(e) => setSelectedTank(e.target.value)}
                        required
                        disabled={loading}
                    >
                        <option value="" disabled>
                            {texts.selectTank}
                        </option>
                        {tankList.map(tank => (
                            <option key={tank.id} value={tank.id}>
                                {tank.name} ({tank.type})
                            </option>
                        ))}
                    </select>
                    <label>{texts.dateOptional}</label>
                    <input
                        type="datetime-local"
                        value={customDate}
                        onChange={(e) => setCustomDate(e.target.value)}
                        disabled={loading}
                    />

                    {/* CAMPO DE VOLUMEN */}
                    <label>{texts.volume}</label>
                    <input
                        type="number"
                        step="0.000001"
                        min="0.000001"
                        max="999.999999"
                        value={volume}
                        onChange={(e) => setVolume(e.target.value)}
                        required
                        placeholder="Ej: 100.5"
                        disabled={loading}
                    />

                    <label>{texts.units}</label>
                    <select
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                        disabled={loading}
                    >
                        <option value="liters">L</option>
                        <option value="ml">Ml</option>
                    </select>
                    <button type="submit" disabled={loading}>
                        {loading ? texts.creating : texts.addRecord}
                    </button>
                </form>

                {/* MENSAJE DE ERROR */}
                {error && <p style={{ color: 'red', marginTop: '10px' }}>{texts[error] || error}</p>}
            </AccordionDetails>
        </Accordion>
    );
}

