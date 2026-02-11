import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import useTexts from "../../utils/UseTexts";
import { supabase } from "../../utils/supabaseClient";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";



export default function UpdatePump({ systemId, pumpList, refresh, error, setError }) {
    const texts = useTexts();
    const navigate = useNavigate();

    const [selectedPump, setSelectedPump] = useState("");
    const [newName, setNewName] = useState("");
    const [newOrigin, setNewOrigin] = useState("");
    const [newDestination, setNewDestination] = useState("");
    const [tankList, setTankList] = useState([]);
    const [loading, setLoading] = useState(false);


    useEffect(() => {
        const fetchTanks = async () => {
            const { data } = await supabase
                .from("tanks")
                .select("id,name")
                .eq("system", systemId);
            setTankList(data || []);
        };
        fetchTanks();
    }, [systemId]);

    useEffect(() => {
        if (!selectedPump) return;
        const pump = pumpList.find(p => p.id === selectedPump);
        if (pump) {
            setNewName(pump.name);
            setNewOrigin(pump.origin?.id || "");
            setNewDestination(pump.destination?.id || "");
        }
    }, [selectedPump, pumpList]);

    const handleUpdatePump = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);


        if (!selectedPump) {
            setError(texts.selectPump);
            setLoading(false);
            return;
        }

        if (!newName && !newOrigin && !newDestination) {
            setError(texts.nothingToUpdate); // Mensaje: "Debes cambiar al menos un campo"
            setLoading(false);
            return;
        }
        const originalPump = pumpList.find(p => p.id === selectedPump);
        if (!originalPump) {
            setError(texts.selectPump);
            setLoading(false);
            return;
        }
        const finalOrigin = newOrigin || originalPump.origin?.id;
        const finalDestination = newDestination || originalPump.destination?.id;

        if (finalOrigin === finalDestination) {
            setError("originDestinationSame");
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

            const updates = {};

            if (newName && newName !== originalPump.name) {
                const nameRegex = /^[A-Za-z0-9][A-Za-z0-9_]{1,28}[A-Za-z0-9]$/;
                if (!nameRegex.test(newName)) {
                    setError("regexNamePumps");
                    setLoading(false);
                    return;
                }

                // Comprobar si el nombre ya existe en otra bomba del sistema
                const { data: existing } = await supabase
                    .from("pumps")
                    .select("*")
                    .eq("system", systemId)
                    .eq("name", newName)
                    .neq("id", selectedPump); // 💡 excluir la bomba actual

                if (existing && existing?.length > 0) {
                    setError("repeatNamePumps");
                    setLoading(false);
                    return;
                }

                updates.name = newName; // 💡 solo actualizar si cambió
            }
            if (newOrigin && newOrigin !== originalPump.origin?.id) updates.origin = newOrigin;
            if (newDestination && newDestination !== originalPump.destination?.id) updates.destination = newDestination;

            // 💡 CAMBIO AQUÍ: Si no hay cambios, no hacer nada
            if (Object.keys(updates).length === 0) {
                setError(texts.nothingToUpdate);
                setLoading(false);
                return;
            }

            // 💡 CAMBIO AQUÍ: actualizar bomba en supabase
            const { error: updateError } = await supabase
                .from("pumps")
                .update(updates)
                .eq("id", selectedPump)
                .eq("system", systemId);

            if (updateError) throw updateError;

            // 💡 CAMBIO AQUÍ: reset de campos
            setSelectedPump("");
            setNewName("");
            setNewOrigin("");
            setNewDestination("");
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
                <h3>{texts.updatePump}</h3>
            </AccordionSummary>
            <AccordionDetails>
                <form onSubmit={handleUpdatePump} className='form-container'>
                    <label htmlFor="select-pump">{texts.selectPump}</label>
                    <select id="select-pump"
                        value={selectedPump || ''}
                        onChange={(e) => setSelectedPump(e.target.value)}
                    >
                        <option value='' disabled>{texts.selectPump}</option>
                        {pumpList.map(p => (
                            <option key={p.id} value={p.id}>
                                {p.name}
                            </option>
                        ))}
                    </select>
                    <label>{texts.newName}</label>
                    <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}

                        placeholder={texts.newName}
                        minLength={3} maxLength={30}
                    />
                    <label>{texts.originTank}</label>
                    <select
                        value={newOrigin}
                        onChange={(e) => setNewOrigin(e.target.value)}

                    >
                        <option value="" disabled>{texts.selectOriginTank}</option>
                        {tankList.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                    </select>

                    <label>{texts.destinationTank}</label>
                    <select
                        value={newDestination}
                        onChange={(e) => setNewDestination(e.target.value)}

                    >
                        <option value="" disabled>{texts.selectDestinationTank}</option>
                        {tankList.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                    </select>

                    <button type="submit" disabled={loading || !selectedPump}>
                        {loading ? texts.updating : texts.update}
                    </button>


                </form>
                {error && <p style={{ color: 'red' }}>{texts[error] || error}</p>}

            </AccordionDetails>
        </Accordion>
    );
}