import { useState } from "react";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import useTexts from "../../utils/UseTexts";
import { supabase } from "../../utils/supabaseClient";
import { useNavigate } from "react-router-dom";

export default function ChangeSecretAccordion({ systemId, secret: initialSecret, refreshSecret, error, setError }) {
    const texts = useTexts();
    const [secret, setSecret] = useState(initialSecret || "");
    const [newSecret, setNewSecret] = useState("");
    const [showSecret, setShowSecret] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const toggleShowSecret = () => setShowSecret(!showSecret);

    const handleSecretChange = async (e) => {
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

            // Comprobar que el usuario está activo en admin_users
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

            // COMPROBACIÓN DIRECTA: Obtener sistema solo si admin = uid
            const { data: systemData, error: systemErr } = await supabase
                .from('systems')
                .select('id') // o cualquier otro campo que necesites
                .eq('id', systemId)
                .eq('admin', uid)  // <- aquí filtramos por admin = uid
                .single();

            if (systemErr || !systemData) {
                // Si no existe o el admin no coincide, redirigir
                navigate("/dashboard");
                return;
            }

            const codeRegex = /^[A-Za-z0-9]{10,30}$/;
            if (!codeRegex.test(newSecret)) {
                setError("regexSecretSystem");
                setLoading(false);
                return;
            }


            // Comprobar que otro sistema del mismo usuario no tenga este secret
            const { data: userSystems, error: systemsErr } = await supabase
                .from("systems")
                .select("id")
                .eq("admin", uid);

            if (systemsErr) throw systemsErr;

            const systemIds = userSystems.map(s => s.id);

            // 2️⃣ Comprobar que otro sistema del mismo usuario no tenga este secret
            const { data: existingSecret, error: secretErr } = await supabase
                .from("system_secrets")
                .select("system")
                .in("system", systemIds)
                .eq("code", newSecret)
                .maybeSingle();

            if (existingSecret) {
                setError("repeatSecretSystem");
                setNewSecret("");
                setLoading(false);
                return;
            }

            const { error } = await supabase
                .from("system_secrets")
                .update({ code: newSecret })
                .eq("system", systemId);

            if (error) throw error;

            setSecret(newSecret);
            setNewSecret("");
            refreshSecret?.();


        } catch (err) {

            setError("Error" || err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <h3>{texts.changeSecret}</h3>
            </AccordionSummary>
            <AccordionDetails>



                <form onSubmit={handleSecretChange} className='form-container'>
                    <label>{texts.currentSecret}</label>
                    <input
                        type={showSecret ? "text" : "password"}  // cambia dinámicamente
                        value={secret}
                        readOnly
                    />
                    <button type="button" onClick={toggleShowSecret}>
                        {showSecret ? texts.hide : texts.show}
                    </button>

                    <label>{texts.newSecret}</label>
                    <input
                        type="text"
                        value={newSecret}
                        onChange={(e) => setNewSecret(e.target.value)}
                        required
                        minLength={10}
                        maxLength={30}
                        placeholder={texts.newSecret}
                    />
                    <button type="submit" disabled={loading}>{texts.newSecret}</button>

                </form>

                {error && <p style={{ color: 'red' }}>{texts[error]}</p>}
            </AccordionDetails>
        </Accordion>
    );
}