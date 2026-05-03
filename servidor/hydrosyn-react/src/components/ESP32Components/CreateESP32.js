import { useState } from "react";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import useTexts from "../../utils/UseTexts";
import { supabase } from "../../utils/supabaseClient";
import { useNavigate } from "react-router-dom";
import { Box, TextField, Button, Alert, Typography } from "@mui/material";




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



            const { data: espCount, error: espError } = await supabase
                .from("esp32")
                .select("*", { count: "exact" })
                .eq("system", systemId);

            if (espError) throw espError;


            if (espCount?.length >= 2) {
                const { data: roleData, error: roleError } = await supabase
                    .from("roles")
                    .select("user")
                    .eq("user", user.id)
                    .maybeSingle();

                if (roleError) throw roleError;

                if (!roleData) {
                    setError(texts.limitESP32);
                    return;
                }
            }


            const nameRegex = /^[A-Za-z0-9][A-Za-z0-9_]{1,28}[A-Za-z0-9]$/;
            if (!nameRegex.test(ESP32Name)) {
                setError("regexNameESP32");
                return;
            }


            const { data: existing, error: existError } = await supabase
                .from("esp32")
                .select("*")
                .eq("system", systemId)
                .eq("name", ESP32Name);

            if (existError) throw existError;

            if (existing?.length > 0) {
                setError("repeatNameESP32");
                return;
            }


            const { data: insertData, error: insertError } = await supabase
                .from("esp32")
                .insert({ name: ESP32Name, system: systemId })
                .select();

            if (insertError) throw insertError;

            setESP32Name("");
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
                    {texts.addESP32}
                </Typography>
            </AccordionSummary>
            <AccordionDetails>

                <Box
                    component="form"
                    onSubmit={handleCreateESP32}
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                        width: '100%'
                    }}
                >

                    <TextField
                        label={texts.nameESP32}
                        placeholder={texts.nameESP32}
                        variant="outlined"
                        value={ESP32Name}
                        onChange={(e) => setESP32Name(e.target.value)}
                        required
                        fullWidth

                        inputProps={{
                            minLength: 3,
                            maxLength: 30
                        }}
                    />


                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        disabled={loading || !ESP32Name}
                    >
                        {texts.addESP32}
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

                        placeholder={texts.nameESP32}
                    />
                    <button type="submit">{texts.addESP32}</button>
                </form>
                {error && <p style={{ color: 'red' }}>{texts[error] || error}</p>}
            </AccordionDetails>
        </Accordion>
*/
    );
}