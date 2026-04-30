import { useState } from "react";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import useTexts from "../../utils/UseTexts";
import { supabase } from "../../utils/supabaseClient";
import { useNavigate } from "react-router-dom";
import { Box, FormControl, InputLabel, Select, MenuItem, TextField, Stack, Button, Typography, Alert } from "@mui/material";


export default function CalibratePump({ systemId, pumpList, refresh, error, setError }) {
    const texts = useTexts();
    const navigate = useNavigate();

    const [selectedPump, setSelectedPump] = useState("");
    const [volume, setVolume] = useState("");
    const [unit, setUnit] = useState("L");
    const [loading, setLoading] = useState(false);
    const [action, setAction] = useState("");

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

        if (action === "calibrate") {
            handleInsertCalibrate();
        } else if (action === "calibration") {
            handleInsertCalibration();
        }
    };
    const handleInsertCalibrate = async () => {
        setError("");
        if (!selectedPump) return setError("selectPump");
        if (!volume) return setError("invalidVolume");
        setLoading(true);

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

            const { error: insertError } = await supabase
                .from("calibrate")
                .insert({ pump: parseInt(selectedPump), user: userId, volume: vol });

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

    const handleInsertCalibration = async () => {
        setError("");
        if (!selectedPump) return setError("selectPump");
        setLoading(true);

        try {
            const userId = await checkUserActive();
            if (!userId) return navigate("/dashboard", { replace: true });

            const { error: insertError } = await supabase
                .from("calibration")
                .insert({ pump: parseInt(selectedPump), user: userId, success: false });

            if (insertError) throw insertError;
            setVolume("");
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
                    {texts.calibratePump}
                </Typography>
            </AccordionSummary>
            <AccordionDetails>
                <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>

                    <FormControl fullWidth disabled={loading}>
                        <InputLabel id="calibrate-pump-select-label">{texts.selectPump}</InputLabel>
                        <Select
                            labelId="calibrate-pump-select-label"
                            value={selectedPump || ''}
                            label={texts.selectPump}
                            onChange={(e) => setSelectedPump(e.target.value)}
                        >
                            <MenuItem value='' disabled>{texts.selectPump}</MenuItem>
                            {pumpList.map(pump => (
                                <MenuItem key={pump.id} value={pump.id}>{pump.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <Stack direction="row" spacing={2}>
                        <TextField
                            label={texts.volume}
                            type="number"
                            value={volume}
                            onChange={(e) => setVolume(e.target.value)}
                            placeholder="Ej: 100.5"
                            disabled={loading}
                            required
                            fullWidth
                            inputProps={{ step: "0.001", min: "0.001", max: "999.999" }}
                        />

                        <FormControl disabled={loading} sx={{ minWidth: 100 }}>
                            <InputLabel id="calibrate-unit-select-label">{texts.units}</InputLabel>
                            <Select
                                labelId="calibrate-unit-select-label"
                                value={unit}
                                label={texts.units}
                                onChange={(e) => setUnit(e.target.value)}
                            >
                                <MenuItem value="mL">mL</MenuItem>
                                <MenuItem value="L">L</MenuItem>
                            </Select>
                        </FormControl>
                    </Stack>

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <Button
                            type="button"
                            variant="outlined"
                            color="primary"
                            onClick={handleInsertCalibration}
                            disabled={loading}
                            fullWidth
                        >
                            {loading ? texts.creating : texts.calibrate}
                        </Button>

                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            onClick={() => setAction("calibrate")}
                            disabled={loading}
                            fullWidth
                        >
                            {loading ? texts.creating : texts.saveCalibration}
                        </Button>
                    </Stack>

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
                <h3>{texts.calibratePump}</h3>
            </AccordionSummary>
            <AccordionDetails>
                <form onSubmit={handleSubmit} className='form-container'>

                    <label htmlFor="select-pump">{texts.selectPump}</label>
                    <select id="select-pump"
                        value={selectedPump || ''}
                        onChange={(e) => setSelectedPump(e.target.value)}
                    >
                        <option value='' disabled>{texts.selectPump}</option>
                        {pumpList.map(pump => (
                            <option key={pump.id} value={pump.id}>{pump.name}</option>
                        ))}
                    </select>

                    <label htmlFor="calibration-volume">
                        {texts.volume}
                    </label>
                    <input
                        id="calibration-volume"
                        type="number"
                        step="0.001"
                        min="0.001"
                        max="999.999"
                        value={volume}
                        onChange={(e) => setVolume(e.target.value)}
                        placeholder="Ej: 100.5"
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


                    <button type="submit" onClick={() => setAction("calibrate")} disabled={loading}>
                        {loading ? texts.creating : texts.saveCalibration}
                    </button>

                    <button type="button" onClick={handleInsertCalibration} disabled={loading}>
                        {loading ? texts.creating : texts.calibrate}
                    </button>



                </form>
                {error && <p style={{ color: 'red' }}>{texts[error] || error}</p>}

            </AccordionDetails>
        </Accordion>
        */
    );
}