import { useState } from "react";
import { supabase } from "../../utils/supabaseClient";
import {
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    Grid,
    Alert,
    Switch,
    FormControlLabel,
} from "@mui/material";
impor
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Add as AddIcon } from "@mui/icons-material";
import useTexts from "../../utils/UseTexts";
import { useNavigate } from "react-router-dom";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import dayjs from "dayjs";




export default function CreateProgrammingLight({
    lightList,
    programmingList,
    refresh,
    error,
    setError,
}) {
    const texts = useTexts();
    const navigate = useNavigate();
    const DAYS = [
        { value: "Monday", label: texts.dayMonday },
        { value: "Tuesday", label: texts.dayTuesday },
        { value: "Wednesday", label: texts.dayWednesday },
        { value: "Thursday", label: texts.dayThursday },
        { value: "Friday", label: texts.dayFriday },
        { value: "Saturday", label: texts.daySaturday },
        { value: "Sunday", label: texts.daySunday },
    ];
    const [formData, setFormData] = useState({
        light_id: "",
        day_of_week: "Monday",
        start_time: dayjs().hour(8).minute(0),
        end_time: dayjs().hour(18).minute(0),
        is_active: true,
    });
    const [loading, setLoading] = useState(false);

    const timeToMinutes = (time) => {

        if (dayjs.isDayjs(time)) {
            return time.hour() * 60 + time.minute();
        }
        const [hours, minutes] = time.split(":").map(Number);
        return hours * 60 + minutes;
    };

    const checkConflict = () => {
        const start = timeToMinutes(formData.start_time);
        const end = timeToMinutes(formData.end_time);

        if (start >= end) return "startAfterEnd";
        const lightId = Number(formData.light_id);
        const conflict = programmingList.some(p => {
            if (p.light_id !== lightId) return false;
            if (p.day_of_week !== formData.day_of_week) return false;

            const existingStart = timeToMinutes(p.start_time);
            const existingEnd = timeToMinutes(p.end_time);


            return start < existingEnd && end > existingStart;
        });

        if (conflict) return "conflictProgrammingLight";
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!formData.light_id) return setError("selectLight");
        const conflictMsg = checkConflict();
        if (conflictMsg) return setError(conflictMsg);

        setLoading(true);
        try {
            const { data: sessionData } = await supabase.auth.getSession();
            if (!sessionData?.session) {
                navigate("/dashboard", { replace: true });
                return;
            }

            const { error } = await supabase.from("programming_lights").insert({
                light: Number(formData.light_id),
                day_of_week: formData.day_of_week,
                start_time: formData.start_time.format("HH:mm:ss"),
                end_time: formData.end_time.format("HH:mm:ss"),

            });

            if (error) throw error;

            setFormData({
                light_id: "",
                day_of_week: "Monday",
                start_time: dayjs().hour(8).minute(0),
                end_time: dayjs().hour(18).minute(0),
                is_active: true,
            });

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
                    {texts.createProgrammingLight}
                </Typography>
            </AccordionSummary>
            <AccordionDetails>
                <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>

                    <FormControl fullWidth disabled={loading}>
                        <InputLabel id="light-select-label">{texts.selectLight}</InputLabel>
                        <Select
                            labelId="light-select-label"
                            value={formData.light_id}
                            label={texts.selectLight}
                            onChange={(e) => setFormData({ ...formData, light_id: e.target.value })}
                        >
                            {lightList.map(l => (
                                <MenuItem key={l.id} value={l.id}>
                                    {l.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl fullWidth disabled={loading}>
                        <InputLabel id="day-select-label">{texts.days}</InputLabel>
                        <Select
                            labelId="day-select-label"
                            value={formData.day_of_week}
                            label={texts.days}
                            onChange={(e) => setFormData({ ...formData, day_of_week: e.target.value })}
                        >
                            {DAYS.map(d => (
                                <MenuItem key={d.value} value={d.value}>
                                    {d.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
                            <TimePicker
                                label={texts.startTime}
                                value={formData.start_time}
                                onChange={(newValue) => setFormData({ ...formData, start_time: newValue })}
                                ampm={false}
                                minutesStep={1}
                                disabled={loading}
                                sx={{ flex: 1 }}
                            />
                            <TimePicker
                                label={texts.endTime}
                                value={formData.end_time}
                                onChange={(newValue) => setFormData({ ...formData, end_time: newValue })}
                                ampm={false}
                                minutesStep={1}
                                disabled={loading}
                                sx={{ flex: 1 }}
                            />
                        </Stack>
                    </LocalizationProvider>

                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        disabled={loading}
                        fullWidth
                    >
                        {loading ? texts.creating : texts.createProgramming}
                    </Button>

                    {error && (
                        <Typography color="error" variant="body2" align="center">
                            {texts[error] || error}
                        </Typography>
                    )}
                </Box>
            </AccordionDetails>
        </Accordion>

        /*
        <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <h3>{texts.createProgrammingLight}</h3>
            </AccordionSummary>
            <AccordionDetails>
                <form onSubmit={handleSubmit} className="form-container">
                    <label>{texts.selectLight}</label>
                    <select
                        value={formData.light_id}
                        onChange={(e) => setFormData({ ...formData, light_id: e.target.value })}
                        disabled={loading}
                    >
                        <option value="" disabled>{texts.selectLight}</option>
                        {lightList.map(l => (
                            <option key={l.id} value={l.id}>{l.name}</option>
                        ))}
                    </select>

                    <label>{texts.days}</label>
                    <select
                        value={formData.day_of_week}
                        onChange={(e) => setFormData({ ...formData, day_of_week: e.target.value })}
                        disabled={loading}
                    >
                        {DAYS.map(d => (
                            <option key={d.value} value={d.value}>{d.label}</option>
                        ))}
                    </select>

                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <label>{texts.startTime}</label>
                        <TimePicker
                            value={formData.start_time}
                            onChange={(newValue) => setFormData({ ...formData, start_time: newValue })}
                            ampm={false}
                            minutesStep={1}
                            disabled={loading}
                        />
                        <label>{texts.endTime}</label>
                        <TimePicker
                            value={formData.end_time}
                            onChange={(newValue) => setFormData({ ...formData, end_time: newValue })}
                            ampm={false}
                            minutesStep={1}
                            disabled={loading}
                        />
                    </LocalizationProvider>


                    <button type="submit" disabled={loading}>
                        {loading ? texts.creating : texts.createProgramming}
                    </button>

                    {error && <p style={{ color: "red" }}>{texts[error] || error}</p>}
                </form>
            </AccordionDetails>
        </Accordion>
        */
    );
}