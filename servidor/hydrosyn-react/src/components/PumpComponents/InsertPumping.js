import { useState } from "react";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import useTexts from "../../utils/UseTexts";
import { supabase } from "../../utils/supabaseClient";
import { useNavigate } from "react-router-dom";
import { Box, FormControl, InputLabel, Select, MenuItem, TextField, Stack, Button, Typography, Alert } from "@mui/material";

export default function InsertPumping({ systemId, pumpList, refresh, error, setError }) {
    const texts = useTexts();
    const navigate = useNavigate();

    const [selectedPump, setSelectedPump] = useState("");
    const [volume, setVolume] = useState("");
    const [unit, setUnit] = useState("L");
    const [loading, setLoading] = useState(false);

    const checkUserActive = async () => {
        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData?.session?.user;
        if (!user) return null;

        const { data: adminData } = await supabase
            .from("admin_users")
            .select("*")
            .eq("user", user.id)
            .eq("is_active", true)
            .maybeSingle();

        const { data: systemUserData } = await supabase
            .from("systems_users")
            .select("*")
            .eq("system", systemId)
            .eq("user_id", user.id)
            .eq("is_active", true)
            .maybeSingle();

        if (!adminData && !systemUserData) return null;
        return user.id;
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        setError("");
        handleInsertPump();
    };
    const handleInsertPump = async () => {
        setError("");
        if (!selectedPump) return setError("selectPump");



        try {
            const userId = await checkUserActive();
            if (!userId) return navigate("/dashboard", { replace: true });

            let vol = parseFloat(volume);
            if (unit === "mL") vol = vol / 1000;

            if (vol <= 0) {
                setError("invalidVolume");
                return;
            }
            if (vol > 999.999) {
                setError("volumeTooHigh");
                return;
            }
            setLoading(true);
            const { error: insertError } = await supabase
                .from("records_pumps")
                .insert({
                    pump: parseInt(selectedPump),
                    user: userId,
                    volume: vol,
                    success: false
                });

            if (insertError) throw insertError;

            setVolume("");
            setSelectedPump("");
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
                    {texts.insertPump}
                </Typography>
            </AccordionSummary>

            <AccordionDetails>
                <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>

                    <FormControl fullWidth disabled={loading}>
                        <InputLabel id="pump-select-label">{texts.selectPump}</InputLabel>
                        <Select
                            labelId="pump-select-label"
                            value={selectedPump}
                            label={texts.selectPump}
                            onChange={(e) => setSelectedPump(e.target.value)}
                        >
                            {pumpList.map(pump => (
                                <MenuItem key={pump.id} value={pump.id}>
                                    {pump.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <Stack direction="row" spacing={2}>
                        <TextField
                            label={texts.volume}
                            type="number"
                            value={volume}
                            onChange={(e) => setVolume(e.target.value)}
                            disabled={loading}
                            required
                            fullWidth
                            inputProps={{ step: "0.001", min: "0.001", max: "999.999" }}
                        />

                        <FormControl disabled={loading} sx={{ minWidth: 100 }}>
                            <InputLabel id="unit-select-label">{texts.units}</InputLabel>
                            <Select
                                labelId="unit-select-label"
                                value={unit}
                                label={texts.units}
                                onChange={(e) => setUnit(e.target.value)}
                            >
                                <MenuItem value="L">L</MenuItem>
                                <MenuItem value="mL">mL</MenuItem>
                            </Select>
                        </FormControl>
                    </Stack>

                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        disabled={loading || !selectedPump || !volume}
                        fullWidth
                    >
                        {loading ? texts.creating : texts.createPumping}
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
                <h3>{texts.insertPump}</h3>
            </AccordionSummary>

            <AccordionDetails>
                <form onSubmit={handleSubmit} className='form-container'>

                    <label>{texts.selectPump}</label>
                    <select
                        value={selectedPump}
                        onChange={(e) => setSelectedPump(e.target.value)}
                        disabled={loading}
                    >
                        <option value="" disabled>{texts.selectPump}</option>
                        {pumpList.map(pump => (
                            <option key={pump.id} value={pump.id}>
                                {pump.name}
                            </option>
                        ))}
                    </select>

                    <label>{texts.volume}</label>
                    <input
                        type="number"
                        step="0.001"
                        min="0.001"
                        max="999.999"
                        value={volume}
                        onChange={(e) => setVolume(e.target.value)}
                        disabled={loading}
                        required
                    />

                    <label>{texts.units}</label>
                    <select
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                        disabled={loading}
                    >
                        <option value="mL">mL</option>
                        <option value="L">L</option>
                    </select>

                    <button type="submit" disabled={loading}>
                        {loading ? texts.creating : texts.createPumping}
                    </button>

                    {error && (
                        <p style={{ color: "red" }}>
                            {texts[error] || error}
                        </p>
                    )}
                </form>
            </AccordionDetails>
        </Accordion>
        */
    );
}
