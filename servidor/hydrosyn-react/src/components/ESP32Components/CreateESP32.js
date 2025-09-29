import { useState } from "react";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import useTexts from "../../utils/UseTexts";
import { supabase } from "../../utils/supabaseClient";
import { useNavigate } from "react-router-dom";


export default function CreateESP32({ systemId, espList, refresh, error, setError }) {
    const navigate = useNavigate();
    const texts = useTexts();


    const [ESP32Name, setESP32Name] = useState("");
    const [loading, setLoading] = useState(false);

    const handleCreateESP32 = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const user = session?.user;
            if (!user) throw new Error("No authenticated");



            const { data: systemData, error: systemError } = await supabase
                .from("systems")
                .select(`
          id,
          admin,
          admin_users (
            user,
            is_active
          )
        `)
                .eq("id", systemId)
                .eq("admin", user.id)
                .maybeSingle();

            if (systemError) throw systemError;

            const adminUser = systemData?.admin_users?.[0]; // primer admin
            if (!adminUser || !adminUser.is_active || adminUser.user !== user.id) {
                navigate("/dashboard");
                return;
            }

            // 2️⃣ Comprobar límite de 2 ESP32 si no tiene rol
            const { data: espCount, error: espError } = await supabase
                .from("esp32")
                .select("*", { count: "exact" })
                .eq("system", systemId);

            if (espError) throw espError;

            // 2️⃣ Si hay 2 o más ESP32, comprobar si el usuario tiene rol
            if (espCount?.length >= 2) {
                const { data: roleData, error: roleError } = await supabase
                    .from("roles")
                    .select("user")
                    .eq("user", user.id)
                    .maybeSingle();

                if (roleError) throw roleError;

                if (!roleData) {
                    setError(texts.limitESP32); // no tiene rol y hay 2 ESP32 → error
                    return;
                }
            }

            // 3️⃣ Validar regex del nombre
            const nameRegex = /^[A-Za-z0-9][A-Za-z0-9_]{1,28}[A-Za-z0-9]$/;
            if (!nameRegex.test(ESP32Name)) {
                setError(texts.regexNameESP32);
                return;
            }

            // 4️⃣ Comprobar nombre repetido en este sistema
            const { data: existing, error: existError } = await supabase
                .from("esp32")
                .select("*")
                .eq("system", systemId)
                .eq("name", ESP32Name);

            if (existError) throw existError;

            if (existing?.length > 0) {
                setError(texts.repeatNameESP32);
                return;
            }

            // 5️⃣ Insertar ESP32
            const { data: insertData, error: insertError } = await supabase
                .from("esp32")
                .insert({ name: ESP32Name, system: systemId })
                .select();

            if (insertError) throw insertError;

            setESP32Name("");
            refresh(); // refresca la lista en el padre

        } catch (err) {

            setError("Error" || err.message);
        } finally {
            setLoading(false);
        }
    };
    return (



        <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <h3>{texts.addESP32}</h3>
            </AccordionSummary>
            <AccordionDetails>
                <form onSubmit={handleCreateESP32} className='form-container'>
                    <label>
                        {texts.nameESP32}
                    </label>
                    <input
                        type="text"
                        value={ESP32Name}
                        onChange={(e) => setESP32Name(e.target.value)}
                        required
                        minLength={3} maxLength={30}

                        placeholder={texts.nameESP32} // placeholder más coherente
                    />
                    <button type="submit">{texts.addESP32}</button>
                </form>
                {error && <p style={{ color: 'red' }}>{error}</p>}
            </AccordionDetails>
        </Accordion>

    );
}