import { useState } from "react";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import useTexts from "../../utils/UseTexts";
import { supabase } from "../../utils/supabaseClient";
import { useNavigate } from "react-router-dom";



export default function CreatePump({ systemId, pumpList, refresh, error, setError }) {

    const navigate = useNavigate();
    const texts = useTexts();



    const [pumpName, setPumpName] = useState("");
    const [esp32Id, setEsp32Id] = useState("");
    const [gpio, setGpio] = useState("");
    const [originTank, setOriginTank] = useState("");
    const [destinationTank, setDestinationTank] = useState("");

    const [esp32List, setEsp32List] = useState([]);
    const [tankList, setTankList] = useState([]);
    const [usedGpios, setUsedGpios] = useState([]);

    const [loading, setLoading] = useState(false);


    useEffect(() => {
        if (!esp32Id) return setUsedGpios([]);

        const fetchUsedGpios = async () => {
            const { data } = await supabase
                .from("pumps")
                .select("gpio")
                .eq("esp32", esp32Id);
            setUsedGpios(data.map(d => d.gpio));
        };

        fetchUsedGpios();
    }, [esp32Id]);

    const availableGpios = [2, 4, 5, 12, 13, 14, 15, 18, 19, 21, 22, 23, 25, 26, 27, 32, 33]
        .filter(pin => !usedGpios.includes(pin));

    useEffect(() => {
        const fetchSystemData = async () => {
            const { data: espData } = await supabase
                .from("esp32")
                .select("id,name")
                .eq("system", systemId);

            const { data: tankData } = await supabase
                .from("tanks")
                .select("id,name")
                .eq("system", systemId);

            setEsp32List(espData || []);
            setTankList(tankData || []);
        };
        fetchSystemData();
    }, [systemId]);


    const handleCreatePump = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);



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
            if (!pumpName || !esp32Id || !gpio || !originTank || !destinationTank) {
                setError("incompleteFields");
                setLoading(false);
                return;
            }
            if (originTank === destinationTank) {
                setError("originDestinationSame");
                setLoading(false);
                return;
            }


            // 3️⃣ Validar regex del nombre
            const nameRegex = /^[A-Za-z0-9][A-Za-z0-9_]{1,28}[A-Za-z0-9]$/;
            if (!nameRegex.test(pumpName)) {
                setError("regexNamePumps");
                return;
            }

            // 4️⃣ Comprobar nombre repetido en este sistema
            const { data: existing, error: existError } = await supabase
                .from("pumps")
                .select("*")
                .eq("system", systemId)
                .eq("name", pumpName);

            if (existError) throw existError;

            if (existing?.length > 0) {
                setError("repeatNamePumps");
                return;
            }

            // 5️⃣ Insertar Tanque
            const { data: insertData, error: insertError } = await supabase
                .from("pumps")
                .insert({
                    name: pumpName,
                    system: systemId,
                    esp32: esp32Id,
                    gpio: parseInt(gpio),
                    origin: originTank,
                    destination: destinationTank
                })
                .select();

            if (insertError) throw insertError;

            setPumpName("");
            setEsp32Id("");
            setGpio("");
            setOriginTank("");
            setDestinationTank("");

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
                <h3>{texts.addPump}</h3>
            </AccordionSummary>
            <AccordionDetails>
                <form onSubmit={handleCreatePump} className='form-container'>
                    <label>
                        {texts.namePump}
                    </label>
                    <input
                        type="text"
                        value={pumpName}
                        onChange={(e) => setPumpName(e.target.value)}
                        required
                        minLength={3} maxLength={30}

                        placeholder={texts.namePump} // placeholder más coherente
                    />


                    <label>{texts.esp32}</label>
                    <select
                        value={esp32Id}
                        onChange={(e) => setEsp32Id(e.target.value)}
                        required
                    >
                        <option value="">{texts.selectESP}</option>
                        {esp32List.map((esp) => (
                            <option key={esp.id} value={esp.id}>
                                {esp.name}
                            </option>
                        ))}
                    </select>

                    <label>{texts.GPIO}</label>

                    <select
                        value={gpio}
                        onChange={(e) => setGpio(e.target.value)}
                        required
                    >
                        <option value="">{texts.selectGPIO}</option>
                        {availableGpios.map((pin) => (
                            <option key={pin} value={pin}>
                                {pin}
                            </option>
                        ))}
                    </select>

                    <label>{texts.originTank}</label>
                    <select
                        value={originTank}
                        onChange={(e) => setOriginTank(e.target.value)}
                        required
                    >
                        <option value="">{texts.selectOriginTank}</option>
                        {tankList.map((tank) => (
                            <option key={tank.id} value={tank.id}>
                                {tank.name}
                            </option>
                        ))}
                    </select>

                    <label>{texts.destinationTank}</label>
                    <select
                        value={destinationTank}
                        onChange={(e) => setDestinationTank(e.target.value)}
                        required
                    >
                        <option value="">{texts.selectDestinationTank}</option>
                        {tankList.map((tank) => (
                            <option key={tank.id} value={tank.id}>
                                {tank.name}
                            </option>
                        ))}
                    </select>

                    <button type="submit" disabled={loading}>{texts.addPump}</button>
                </form>
                {error && <p style={{ color: 'red' }}>{texts[error] || error}</p>}
            </AccordionDetails>
        </Accordion>

    );


}