import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import useTexts from "../../utils/UseTexts";
import { supabase } from "../../utils/supabaseClient";

export default function RenameSystem({ systemId, systemName, refresh, error, setError }) {
    const texts = useTexts();
    const navigate = useNavigate();
    const [name, setName] = useState(systemName || "");
    const [loading, setLoading] = useState(false);

    const handleRename = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const { data: { session }, error: sessionErr } = await supabase.auth.getSession();
            if (sessionErr || !session || !session.user) {
                navigate("/dashboard");
                return;
            }
            const uid = session.user.id;

            // Verificar que el usuario es admin activo
            const { data: adminData, error: adminErr } = await supabase
                .from('admin_users')
                .select('id')
                .eq('user', uid)
                .eq('is_active', true)
                .single();

            if (adminErr || !adminData) {
                navigate("/dashboard");
                return;
            }

            // Verificar que el sistema existe y admin coincide
            const { data: systemData, error: systemErr } = await supabase
                .from('systems')
                .select('id')
                .eq('id', systemId)
                .eq('admin', uid)
                .single();

            if (systemErr || !systemData) {
                navigate("/dashboard");
                return;
            }

            const systemNameRegex = /^[A-Za-z0-9][A-Za-z0-9_ ]{1,28}[A-Za-z0-9]$/;
            if (!systemNameRegex.test(name)) {
                setError("regexSystemName");
                setLoading(false);
                return;
            }
            const { data: existingSystem, error: duplicateErr } = await supabase
                .from('systems')
                .select('id')
                .eq('admin', uid)            // sistemas del mismo usuario
                .eq('name', name)            // mismo nombre
                .neq('id', systemId)         // excluir el sistema actual
                .maybeSingle();

            if (duplicateErr) throw duplicateErr;

            if (existingSystem) {
                setError("repeatNameSystem");
                setLoading(false);
                return;
            }
            // Actualizar en la base de datos
            const { error: updateErr } = await supabase
                .from('systems')
                .update({ name })
                .eq('id', systemId);

            if (updateErr) throw updateErr;

            refresh?.();

        } catch (err) {
            setError("Error" || err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <h3>{texts.renameSystem}</h3>
            </AccordionSummary>
            <AccordionDetails>


                <form onSubmit={handleRename} className='form-container'>
                    <label>
                        {texts.newName}
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        minLength={3}
                        maxLength={30}
                        placeholder={texts.newName} // placeholder más coherente
                    />
                    <button type="submit">{texts.renameSystem}</button>
                </form>
                {error && <p style={{ color: 'red' }}>{texts[error]}</p>}

            </AccordionDetails>
        </Accordion>
    );

}