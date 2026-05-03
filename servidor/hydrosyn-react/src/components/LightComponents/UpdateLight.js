
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import useTexts from "../../utils/UseTexts";
import { supabase } from "../../utils/supabaseClient";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Box, TextField, Button, Alert, MenuItem, Typography } from "@mui/material";



export default function UpdateLight({ systemId, lightList, refresh, error, setError }) {
    const texts = useTexts();
    const navigate = useNavigate();

    const [selectedLight, setSelectedLight] = useState("");
    const [newName, setNewName] = useState("");
    const [newEsp32, setNewEsp32] = useState("");
    const [newGpio, setNewGpio] = useState("");

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
        if (!selectedLight) return;
        const light = lightList.find(l => l.id === selectedLight);
        if (light) {
            setNewName(light.name);
            setNewEsp32(light.esp32?.id || "");
            setNewGpio(light.gpio || "");
        }
    }, [selectedLight, lightList]);


    useEffect(() => {
        if (!newEsp32) {
            setUsedGpios([]);
            return;
        }

        const fetchUsedGpiosByLights = async () => {
            const { data } = await supabase
                .from("lights")
                .select("gpio")
                .eq("esp32", newEsp32)
                .neq("id", selectedLight || 0);
            setUsedGpios((data || []).map(d => d.gpio));
        };

        fetchUsedGpiosByLights();
    }, [newEsp32, selectedLight]);


    useEffect(() => {
        if (!newEsp32) {
            setUsedGpiosByPumps([]);
            return;
        }

        const fetchUsedGpiosByPumps = async () => {
            const { data } = await supabase
                .from("pumps")
                .select("gpio")
                .eq("esp32", newEsp32);
            setUsedGpiosByPumps((data || []).map(d => d.gpio));
        };

        fetchUsedGpiosByPumps();
    }, [newEsp32]);


    const allGpios = [2, 4, 5, 12, 13, 14, 15, 18, 19, 21, 22, 23, 25, 26, 27, 32, 33];
    const availableGpios = allGpios.filter(pin =>
        !usedGpios.includes(pin) && !usedGpiosByPumps.includes(pin)
    );

    const handleUpdateLight = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        if (!selectedLight) {
            setError("selectLight");
            setLoading(false);
            return;
        }

        const originalLight = lightList.find(l => l.id === selectedLight);
        if (!originalLight) {
            setError("selectLight");
            setLoading(false);
            return;
        }


        const hasNameChange = newName && newName !== originalLight.name;
        const hasEsp32Change = newEsp32 && newEsp32 !== originalLight.esp32?.id;
        const hasGpioChange = newGpio && newGpio !== originalLight.gpio;

        if (!hasNameChange && !hasEsp32Change && !hasGpioChange) {
            setError("nothingToUpdate");
            setLoading(false);
            return;
        }

        try {

            const { data: sessionData } = await supabase.auth.getSession();
            if (!sessionData?.session) {
                navigate("/dashboard", { replace: true });
                return;
            }
            const uid = sessionData.session.user.id;


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


            if (hasNameChange) {
                const nameRegex = /^[A-Za-z0-9][A-Za-z0-9_]{1,28}[A-Za-z0-9]$/;
                if (!nameRegex.test(newName)) {
                    setError("regexNameLights");
                    setLoading(false);
                    return;
                }


                const { data: existing } = await supabase
                    .from("lights")
                    .select("*")
                    .eq("system", systemId)
                    .eq("name", newName)
                    .neq("id", selectedLight);

                if (existing && existing.length > 0) {
                    setError("repeatNameLight");
                    setLoading(false);
                    return;
                }

                updates.name = newName;
            }



            const { error: updateError } = await supabase
                .from("lights")
                .update(updates)
                .eq("id", selectedLight)
                .eq("system", systemId);

            if (updateError) throw updateError;


            setSelectedLight("");
            setNewName("");
            setNewEsp32("");
            setNewGpio("");
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
                    {texts.updateLight || "Actualizar Luz"}
                </Typography>
            </AccordionSummary>
            <AccordionDetails>
                <Box
                    component="form"
                    onSubmit={handleUpdateLight}
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                        width: '100%'
                    }}
                >

                    <TextField
                        select
                        id="select-light"
                        label={texts.selectLight}
                        value={selectedLight || ''}

                        onChange={(e) => setSelectedLight(Number(e.target.value))}
                        fullWidth
                        disabled={loading}
                    >
                        <MenuItem value="" disabled>
                            {texts.selectLight}
                        </MenuItem>
                        {lightList.map((l) => (
                            <MenuItem key={l.id} value={l.id}>
                                {l.name}
                            </MenuItem>
                        ))}
                    </TextField>


                    <TextField
                        label={texts.newName}
                        placeholder={texts.newName}
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        fullWidth
                        disabled={loading}
                        inputProps={{
                            minLength: 3,
                            maxLength: 30
                        }}
                    />


                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        disabled={loading || !selectedLight}
                    >
                        {loading ? (texts.updating) : (texts.update)}
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
                <h3>{texts.updateLight || "Actualizar Luz"}</h3>
            </AccordionSummary>
            <AccordionDetails>
                <form onSubmit={handleUpdateLight} className='form-container'>
                    <label htmlFor="select-light">{texts.selectLight}</label>
                    <select
                        id="select-light"
                        value={selectedLight || ''}
                        onChange={(e) => setSelectedLight(Number(e.target.value))}
                    >
                        <option value='' disabled>{texts.selectLight}</option>
                        {lightList.map(l => (
                            <option key={l.id} value={l.id}>
                                {l.name}
                            </option>
                        ))}
                    </select>

                    <label>{texts.newName}</label>
                    <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder={texts.newName}
                        minLength={3}
                        maxLength={30}
                    />





                    <button type="submit" disabled={loading || !selectedLight}>
                        {loading ? texts.updating : texts.update}
                    </button>
                </form>
                {error && <p style={{ color: 'red' }}>{texts[error] || error}</p>}
            </AccordionDetails>
        </Accordion>

        */
    );
}