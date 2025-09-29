import { useState } from "react";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import useTexts from "../../utils/UseTexts";
import { supabase } from "../../utils/supabaseClient";
import { useNavigate } from "react-router-dom";
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';


export default function CreateUserSystem({ systemId, refreshUsers, refreshAvailable, error: externalError, setError: setExternalError, loading: externalLoading }) {
    const navigate = useNavigate();
    const texts = useTexts();

    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const [message, setMessage] = useState("");

    const checkAdmin = async () => {
        const { data: { user }, error: authErr } = await supabase.auth.getUser();
        if (authErr || !user) {
            navigate("/dashboard");
            return false;
        }

        const { data: adminData, error: adminErr } = await supabase
            .from("admin_users")
            .select("user, is_active")
            .eq("user", user.id)
            .eq("is_active", true)
            .single();

        if (adminErr || !adminData) {
            navigate("/dashboard");
            return false;
        }

        const { data: systemData, error: systemErr } = await supabase
            .from("systems")
            .select("id, admin")
            .eq("id", systemId)
            .eq("admin", user.id)
            .single();

        if (systemErr || !systemData) {
            navigate("/dashboard");
            return false;
        }

        return user
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const admin = await checkAdmin();
        if (!admin) return; // ya navegó a dashboard si no es admin

        setLoading(true);
        setMessage("");

        setExternalError("");

        try {
            const { data: associatedUsers, error: associatedErr } = await supabase
                .from("systems_users")
                .select("user_id")
                .eq("system", systemId);

            if (associatedErr) throw new Error(associatedErr.message)

            if (associatedUsers.length >= 5) {
                const { data: rolesData, error: rolesErr } = await supabase
                    .from("roles")
                    .select("user")
                    .eq("user", admin.id);

                if (rolesErr) throw new Error(rolesErr.message);

                const isAdminAuthorized = rolesData.length > 0;
                if (!isAdminAuthorized) {
                    setExternalError("limitUsers");
                    return;
                }
            }
            // Llamada correcta a Supabase Edge Function
            const { data, error: funcError } = await supabase.functions.invoke(
                "create-user", // nombre de tu Edge Function
                {
                    body: { systemId, email }
                }
            );

            if (funcError) throw funcError;

            // setMessage("userCreated");
            setEmail("");
            refreshUsers();
            refreshAvailable();
        } catch (err) {
            setExternalError("Error" || err.message);

        } finally {
            setLoading(false);
        }

    };


    return (
        <>

            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <h3>{texts.createUser}</h3>
                </AccordionSummary>
                <AccordionDetails>
                    <form onSubmit={handleSubmit} className='form-container'>
                        <label>
                            {texts.email}
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder={texts.email}
                        />

                        <button type="submit" disabled={loading}>
                            {loading ? texts.creating : texts.createUser}
                        </button>
                    </form>

                    {externalError && <p style={{ color: 'red' }}>{texts[externalError] || externalError}</p>}
                </AccordionDetails>
            </Accordion>


        </>
    );
}
