import { useState, useEffect } from "react";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import useTexts from "../../utils/UseTexts";
import { supabase } from "../../utils/supabaseClient";
import { useNavigate } from "react-router-dom";
import { DateTimePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { useLanguage } from "../../utils/LanguageContext";
import 'dayjs/locale/es';
import 'dayjs/locale/en';

export default function CreateRecord({ systemId, tankList, refresh, error, setError }) {





    const navigate = useNavigate();
    const texts = useTexts();
    const { language } = useLanguage();

    const [selectedTank, setSelectedTank] = useState("");
    const [volume, setVolume] = useState("");
    const [unit, setUnit] = useState("liters");
    const [loading, setLoading] = useState(false);
    const [customDate, setCustomDate] = useState(null);

    useEffect(() => {
        if (selectedTank && !tankList.find(t => t.id === parseInt(selectedTank))) {
            setSelectedTank("");
        }
    }, [tankList, selectedTank]);

    useEffect(() => {
        const init = async () => {
            const allowed = await checkAccess();
            console.log("=== DEBUG CreateRecord init ===");
            console.log("1. allowed:", allowed);

            if (!allowed) {
                navigate("/dashboard");
                return;
            }

        };

        init();
    }, [systemId]);


    const checkAccess = async () => {

        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData?.session?.user;
        if (!user) return false;
        console.log("=== DEBUG CreateRecord checkAccess ===");
        console.log("1. user:", user);


        const { data: system } = await supabase
            .from("systems")
            .select("id, admin")
            .eq("id", systemId)
            .maybeSingle();
        console.log("=== DEBUG CreateRecord checkAccess ===");
        console.log("2. system:", system);
        if (!system) return false;


        const { data: adminData } = await supabase
            .from("admin_users")
            .select("is_active")
            .eq("user", system.admin)
            .maybeSingle();

        if (!adminData?.is_active) return false;


        if (system.admin === user.id) return true;


        const { data: userRelation } = await supabase
            .from("systems_users")
            .select("is_active")
            .eq("system", systemId)
            .eq("user_id", user.id)
            .maybeSingle();
        console.log("=== DEBUG CreateRecord checkAccess ===");
        console.log("1. user:", user);
        console.log("2. system:", system);
        console.log("3. adminData:", adminData);
        console.log("4. userRelation:", userRelation);

        if (userRelation?.is_active) return true;

        return false;
    };



    const handleCreateRecord = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        if (!selectedTank) {
            setError("selectTank");
            setLoading(false);
            return;
        }

        if (!volume || parseFloat(volume) <= 0) {
            setError("invalidVolume");
            setLoading(false);
            return;
        }
        const allowed = await checkAccess();
        if (!allowed) {

            navigate("/dashboard");
            return;
        }
        let volumeNum = parseFloat(volume);

        if (unit === "mL") {
            volumeNum = volumeNum / 1000;
        }

        if (volumeNum > 999.999) {
            setError("volumeTooHigh");
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
            const recordDate = customDate ? customDate.utc().toISOString() : null;


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
                    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={language}>
                        <DateTimePicker

                            value={customDate}
                            onChange={(newValue) => setCustomDate(newValue)}
                            disabled={loading}
                        />
                    </LocalizationProvider>


                    <label>{texts.volume}</label>
                    <input
                        type="number"
                        step="0.001"
                        min="0.001"
                        max="999.999"
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
                        <option value="mL">mL</option>
                    </select>
                    <button type="submit" disabled={loading}>
                        {loading ? texts.creating : texts.addRecord}
                    </button>
                </form>


                {error && <p style={{ color: 'red', marginTop: '10px' }}>{texts[error] || error}</p>}
            </AccordionDetails>
        </Accordion>
    );
}

