import { useState } from "react";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import useTexts from "../../utils/UseTexts";
import { supabase } from "../../utils/supabaseClient";
import { useNavigate } from "react-router-dom";



export default function CreateTank({ systemId, tankList, refresh, error, setError }) {

    const navigate = useNavigate();
    const texts = useTexts();
    const [tankType, setTankType] = useState("");


    const [tankName, setTankName] = useState("");
    const [loading, setLoading] = useState(false);

    const handleCreateTank = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        if (!tankType) {
            setError(texts.selectTankType);
            setLoading(false);
            return;
        }



        try {
            const { data: sessionData } = await supabase.auth.getSession();
            const user = sessionData?.session?.user;
            if (!user) throw new Error("No authenticated");


            const { data: systemData, error: systemError } = await supabase
                .from("systems")
                .select("id, admin")
                .eq("id", systemId)
                .maybeSingle();

            if (systemError) throw systemError;

            if (!systemData) {
                navigate("/dashboard");
                return;
            }

            // Verificar si el usuario es admin activo
            const { data: adminData, error: adminError } = await supabase
                .from("admin_users")
                .select("*")
                .eq("user", user.id)
                .eq("is_active", true)
                .maybeSingle();

            if (adminError) throw adminError;
            if (!adminData || systemData.admin !== user.id) {
                navigate("/dashboard");
                return;
            }

            // 2️⃣ Comprobar límite de 2 ESP32 si no tiene rol
            const { data: espCount, count, error: espError } = await supabase
                .from("tanks")
                .select("*", { count: "exact" })
                .eq("system", systemId);

            if (espError) throw espError;

            // 2️⃣ Si hay 2 o más ESP32, comprobar si el usuario tiene rol
            if (count >= 20) {
                const { data: roleData, error: roleError } = await supabase
                    .from("roles")
                    .select("user")
                    .eq("user", user.id)
                    .maybeSingle();

                if (roleError) throw roleError;

                if (!roleData) {
                    setError(texts.limitTanks); // no tiene rol y hay 20 Tanks → error
                    return;
                }
            }

            // 3️⃣ Validar regex del nombre
            const nameRegex = /^[A-Za-z0-9][A-Za-z0-9_]{1,28}[A-Za-z0-9]$/;
            if (!nameRegex.test(tankName)) {
                setError("regexNameTanks");
                return;
            }

            // 4️⃣ Comprobar nombre repetido en este sistema
            const { data: existing, error: existError } = await supabase
                .from("tanks")
                .select("*")
                .eq("system", systemId)
                .eq("name", tankName);

            if (existError) throw existError;

            if (existing?.length > 0) {
                setError("repeatNameTanks");
                return;
            }

            // 5️⃣ Insertar Tanque
            const { data: insertData, error: insertError } = await supabase
                .from("tanks")
                .insert({ name: tankName, system: systemId, type: tankType })
                .select();

            if (insertError) throw insertError;

            setTankName("");
            setTankType("");

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
                <h3>{texts.addTank}</h3>
            </AccordionSummary>
            <AccordionDetails>
                <form onSubmit={handleCreateTank} className='form-container'>
                    <label>
                        {texts.nameTank}
                    </label>
                    <input
                        type="text"
                        value={tankName}
                        onChange={(e) => setTankName(e.target.value)}
                        required
                        minLength={3} maxLength={30}

                        placeholder={texts.nameTank} // placeholder más coherente
                    />
                    <label>{texts.selectTankType}</label>
                    <select
                        value={tankType}
                        onChange={(e) => setTankType(e.target.value)}
                        required
                    >
                        <option value="" disabled>{texts.selectTankType}</option>
                        <option value="water">{texts.water}</option>
                        <option value="rotifers">{texts.rotifers}</option>
                        <option value="copepods">{texts.copepods}</option>
                        <option value="artemias">{texts.artemias}</option>
                        <option value="microalga">{texts.microalga}</option>
                        <option value="nutrients">{texts.nutrients}</option>
                    </select>

                    <button type="submit" disabled={loading}>{texts.addTank}</button>
                </form>
                {error && <p style={{ color: 'red' }}>{texts[error] || error}</p>}
            </AccordionDetails>
        </Accordion>

    );


}