import { useState } from "react";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import useTexts from "../../utils/UseTexts";
import { supabase } from "../../utils/supabaseClient";
import { useNavigate } from "react-router-dom";


export default function RenameTank({ systemId, tankList, refresh, error, setError }) {
    const texts = useTexts();
    const navigate = useNavigate();

    const [selectedTank, setSelectedTank] = useState("");
    const [newName, setNewName] = useState("");
    const [loading, setLoading] = useState(false);

    const handleRename = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        if (!selectedTank || !newName) {
            setError(texts.selectTank);
            setLoading(false);
            return;
        }

        try {
            // ✅ Sesión activa
            const { data: sessionData } = await supabase.auth.getSession();
            if (!sessionData?.session) {
                navigate("/dashboard", { replace: true });
                return;
            }
            const uid = sessionData.session.user.id;

            // ✅ Usuario activo en admin_users
            const { data: adminData } = await supabase
                .from("admin_users")
                .select("*")
                .eq("user", uid)
                .eq("is_active", true)
                .maybeSingle();

            if (!adminData) {
                navigate("/dashboard", { replace: true });
                return;
            }

            // ✅ Usuario admin del sistema
            const { data: systemData } = await supabase
                .from("systems")
                .select("*")
                .eq("id", systemId)
                .eq("admin", uid)
                .maybeSingle();

            if (!systemData) {
                navigate("/dashboard", { replace: true });
                return;
            }

            // ✅ Validar regex
            const nameRegex = /^[A-Za-z0-9][A-Za-z0-9_]{1,28}[A-Za-z0-9]$/;
            if (!nameRegex.test(newName)) {
                setError(texts.regexNameTanks);
                return;
            }

            // ✅ Comprobar nombre repetido
            const { data: existing } = await supabase
                .from("tanks")
                .select("*")
                .eq("system", systemId)
                .eq("name", newName);

            if (existing?.length > 0) {
                setError(texts.repeatNameTanks);
                return;
            }

            // ✅ Actualizar nombre
            const { error: updateError } = await supabase
                .from("tanks")
                .update({ name: newName })
                .eq("id", selectedTank)
                .eq("system", systemId);

            if (updateError) throw updateError;

            // ✅ Reset y refrescar datos
            setSelectedTank("");
            setNewName("");
            refresh();

        } catch (err) {
            console.error(err);
            setError("Error" || err.message);
        } finally {
            setLoading(false);
        }
    };



    return (
        <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <h3>{texts.renameTank}</h3>
            </AccordionSummary>
            <AccordionDetails>
                <form onSubmit={handleRename} className='form-container'>
                    <label htmlFor="select-tank">{texts.selectTank}</label>
                    <select id="select-tank"
                        value={selectedTank || ''}
                        onChange={(e) => setSelectedTank(e.target.value)}
                    >
                        <option value='' disabled>{texts.selectTank}</option>
                        {tankList.map(tank => (
                            <option key={tank.id} value={tank.id}>{tank.name}</option>
                        ))}
                    </select>
                    <label>{texts.newName}</label>
                    <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        required
                        placeholder={texts.newName}
                        minLength={3} maxLength={30}
                    />

                    <button type="submit" disabled={loading || !selectedTank || !newName}>
                        {loading ? texts.renaming : texts.rename}
                    </button>


                </form>
                {error && <p style={{ color: 'red' }}>{error}</p>}

            </AccordionDetails>
        </Accordion>
    );
}