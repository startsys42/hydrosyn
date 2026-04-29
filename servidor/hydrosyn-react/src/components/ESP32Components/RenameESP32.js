import { useState } from "react";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import useTexts from "../../utils/UseTexts";
import { supabase } from "../../utils/supabaseClient";
import { useNavigate } from "react-router-dom";
import { Box, TextField, Button, Alert, MenuItem, Typography } from "@mui/material";


export default function RenameESP32({ systemId, espList, refresh, error, setError }) {
    const texts = useTexts();
    const navigate = useNavigate();

    const [selectedEsp, setSelectedEsp] = useState("");
    const [newName, setNewName] = useState("");
    const [loading, setLoading] = useState(false);

    const handleRename = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        if (!selectedEsp || !newName) {
            setError(texts.selectESP32);
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


            const nameRegex = /^[A-Za-z0-9][A-Za-z0-9_]{1,28}[A-Za-z0-9]$/;
            if (!nameRegex.test(newName)) {
                setError("regexNameESP32");
                return;
            }


            const { data: existing } = await supabase
                .from("esp32")
                .select("*")
                .eq("system", systemId)
                .eq("name", newName);

            if (existing?.length > 0) {
                setError("repeatNameESP32");
                return;
            }


            const { error: updateError } = await supabase
                .from("esp32")
                .update({ name: newName })
                .eq("id", selectedEsp)
                .eq("system", systemId);

            if (updateError) throw updateError;


            setSelectedEsp("");
            setNewName("");
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
                    {texts.renameESP32}
                </Typography>
            </AccordionSummary>
            <AccordionDetails>
                <Box
                    component="form"
                    onSubmit={handleRename}
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                        maxWidth: 400,
                        width: '100%'
                    }}
                >

                    <TextField
                        select
                        id="select-esp32"
                        label={texts.selectESP32}
                        value={selectedEsp || ''}
                        onChange={(e) => setSelectedEsp(e.target.value)}
                        required
                        fullWidth
                        disabled={loading}
                    >
                        <MenuItem value="" disabled>
                            {texts.selectESP32}
                        </MenuItem>
                        {espList.map((esp) => (
                            <MenuItem key={esp.id} value={esp.id}>
                                {esp.name}
                            </MenuItem>
                        ))}
                    </TextField>


                    <TextField
                        label={texts.newName}
                        placeholder={texts.newName}
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        required
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
                        disabled={loading || !selectedEsp || !newName}
                    >
                        {loading ? texts.renaming : texts.rename}
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
                <h3>{texts.renameESP32}</h3>
            </AccordionSummary>
            <AccordionDetails>
                <form onSubmit={handleRename} className='form-container'>
                    <label htmlFor="select-esp32">{texts.selectESP32}</label>
                    <select id="select-esp32"
                        value={selectedEsp || ''}
                        onChange={(e) => setSelectedEsp(e.target.value)}
                    >
                        <option value='' disabled>{texts.selectESP32}</option>
                        {espList.map(esp => (
                            <option key={esp.id} value={esp.id}>{esp.name}</option>
                        ))}
                    </select>
                    <label>{texts.newName}</label>
                    <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        required
                        placeholder={texts.newName}
                        minLength={3} maxLength={30}
                    />

                    <button type="submit" disabled={loading || !selectedEsp || !newName}>
                        {loading ? texts.renaming : texts.rename}
                    </button>


                </form>
                {error && <p style={{ color: 'red' }}>{texts[error] || error}</p>}

            </AccordionDetails>
        </Accordion>
        */
    );
}