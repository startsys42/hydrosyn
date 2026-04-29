
import { useState, useEffect } from "react";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import useTexts from "../../utils/UseTexts";
import { supabase } from "../../utils/supabaseClient";
import { useNavigate } from "react-router-dom";
import { Box, TextField, Button, Alert, MenuItem } from "@mui/material";



export default function CreateLight({ systemId, lightList, refresh, error, setError }) {
    const navigate = useNavigate();
    const texts = useTexts();

    const [lightName, setLightName] = useState("");
    const [esp32Id, setEsp32Id] = useState("");
    const [gpio, setGpio] = useState("");

    const [esp32List, setEsp32List] = useState([]);
    const [usedGpios, setUsedGpios] = useState([]);
    const [usedGpiosByPumps, setUsedGpiosByPumps] = useState([]);
    const [loading, setLoading] = useState(false);


    useEffect(() => {
        const fetchEsp32List = async () => {
            const { data } = await supabase
                .from("esp32")
                .select("id,name")
                .eq("system", systemId);
            setEsp32List(data || []);
        };
        fetchEsp32List();
    }, [systemId]);


    useEffect(() => {
        if (!esp32Id) {
            setUsedGpios([]);
            return;
        }

        const fetchUsedGpiosByLights = async () => {
            const { data } = await supabase
                .from("lights")
                .select("gpio")
                .eq("esp32", esp32Id);
            setUsedGpios((data || []).map(d => d.gpio));
        };

        fetchUsedGpiosByLights();
    }, [esp32Id, lightList]);


    useEffect(() => {
        if (!esp32Id) {
            setUsedGpiosByPumps([]);
            return;
        }

        const fetchUsedGpiosByPumps = async () => {
            const { data } = await supabase
                .from("pumps")
                .select("gpio")
                .eq("esp32", esp32Id);
            setUsedGpiosByPumps((data || []).map(d => d.gpio));
        };

        fetchUsedGpiosByPumps();
    }, [esp32Id]);


    const allGpios = [2, 4, 5, 12, 13, 14, 15, 18, 19, 21, 22, 23, 25, 26, 27, 32, 33];
    const availableGpios = allGpios.filter(pin =>
        !usedGpios.includes(pin) && !usedGpiosByPumps.includes(pin)
    );

    const handleCreateLight = async (e) => {
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


            if (!lightName || !esp32Id || !gpio) {
                setError("incompleteFields");
                setLoading(false);
                return;
            }


            const nameRegex = /^[A-Za-z0-9][A-Za-z0-9_]{1,28}[A-Za-z0-9]$/;
            if (!nameRegex.test(lightName)) {
                setError("regexNameLights");
                return;
            }


            const { data: existing, error: existError } = await supabase
                .from("lights")
                .select("*")
                .eq("system", systemId)
                .eq("name", lightName);

            if (existError) throw existError;
            if (existing?.length > 0) {
                setError("repeatNameLight");
                return;
            }


            const { data: lightCount, error: countError } = await supabase
                .from("lights")
                .select("id", { count: "exact", head: true })
                .eq("system", systemId);

            if (countError) throw countError;
            if (lightCount >= 6) {
                setError("maxLightsReached");
                return;
            }


            const { data: insertData, error: insertError } = await supabase
                .from("lights")
                .insert({
                    name: lightName,
                    system: systemId,
                    esp32: esp32Id,
                    gpio: parseInt(gpio)
                })
                .select();

            if (insertError) throw insertError;


            setLightName("");
            setEsp32Id("");
            setGpio("");


            refresh();

        } catch (err) {

            setError("Error" || err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6" component="h3">
                    {texts.addLight || "Agregar Luz"}
                </Typography>
            </AccordionSummary>
            <AccordionDetails>
                <Box
                    component="form"
                    onSubmit={handleCreateLight}
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                        maxWidth: 400,
                        width: '100%'
                    }}
                >

                    <TextField
                        label={texts.nameLight}
                        placeholder={texts.nameLight}
                        variant="outlined"
                        value={lightName}
                        onChange={(e) => setLightName(e.target.value)}
                        required
                        fullWidth
                        inputProps={{
                            minLength: 3,
                            maxLength: 30
                        }}
                    />


                    <TextField
                        select
                        label={texts.esp32 || "ESP32"}
                        value={esp32Id}
                        onChange={(e) => setEsp32Id(e.target.value)}
                        required
                        fullWidth
                        variant="outlined"
                    >
                        <MenuItem value="" disabled>
                            {texts.selectESP32}
                        </MenuItem>
                        {esp32List.map((esp) => (
                            <MenuItem key={esp.id} value={esp.id}>
                                {esp.name}
                            </MenuItem>
                        ))}
                    </TextField>


                    <TextField
                        select
                        label={texts.GPIO}
                        value={gpio}
                        onChange={(e) => setGpio(e.target.value)}
                        required
                        fullWidth
                        variant="outlined"
                    >
                        <MenuItem value="" disabled>
                            {texts.selectGPIO}
                        </MenuItem>
                        {availableGpios.map((pin) => (
                            <MenuItem key={pin} value={pin}>
                                {pin}
                            </MenuItem>
                        ))}
                    </TextField>


                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        disabled={loading}
                    >
                        {loading ? (texts.creating || "Creando...") : (texts.addLight || "Agregar Luz")}
                    </Button>


                    {error && (
                        <Alert severity="error">
                            {texts[error] || error}
                        </Alert>
                    )}
                </Box>
            </AccordionDetails>
        </Accordion>
        /*
        <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <h3>{texts.addLight || "Agregar Luz"}</h3>
            </AccordionSummary>
            <AccordionDetails>
                <form onSubmit={handleCreateLight} className='form-container'>
                    <label>
                        {texts.nameLight}
                    </label>
                    <input
                        type="text"
                        value={lightName}
                        onChange={(e) => setLightName(e.target.value)}
                        required
                        minLength={3}
                        maxLength={30}
                        placeholder={texts.nameLight}
                    />

                    <label>{texts.esp32 || "ESP32"}</label>
                    <select
                        value={esp32Id}
                        onChange={(e) => setEsp32Id(e.target.value)}
                        required
                    >
                        <option value="">{texts.selectESP32}</option>
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

                    <button type="submit" disabled={loading}>
                        {loading ? (texts.creating) : (texts.addLight)}
                    </button>
                </form>
                {error && <p style={{ color: 'red' }}>{texts[error] || error}</p>}
            </AccordionDetails>
        </Accordion>
        */
    );
}