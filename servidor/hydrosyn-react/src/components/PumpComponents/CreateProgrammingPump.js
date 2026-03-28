import { useState } from "react";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import useTexts from "../../utils/UseTexts";
import { supabase } from "../../utils/supabaseClient";
import { useNavigate } from "react-router-dom";
import '../../styles/theme.css';
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import dayjs from "dayjs";
import { StyledEngineProvider } from "@mui/material/styles";

export default function CreateProgrammingPump({
    pumpList,
    programmingList,
    refresh,
    error,
    setError
}) {

    const texts = useTexts();
    const navigate = useNavigate();

    const [selectedPump, setSelectedPump] = useState("");
    const [day, setDay] = useState("Monday");
    const [timeValue, setTimeValue] = useState(null);
    const [volume, setVolume] = useState("");
    const [loading, setLoading] = useState(false);
    const [unit, setUnit] = useState("L");

    const DAYS = [
        { value: "Monday", label: texts.dayMonday },
        { value: "Tuesday", label: texts.dayTuesday },
        { value: "Wednesday", label: texts.dayWednesday },
        { value: "Thursday", label: texts.dayThursday },
        { value: "Friday", label: texts.dayFriday },
        { value: "Saturday", label: texts.daySaturday },
        { value: "Sunday", label: texts.daySunday },
    ];

    const checkConflict = () => {
        if (!timeValue) return false;
        const timeStr = timeValue.format("HH:mm:ss"); // hora tal cual usuario la ve

        return programmingList.some(p =>
            p.pump_id === Number(selectedPump) &&
            p.day_of_week === day &&
            p.clock === timeStr
        );
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!selectedPump) return setError("selectPump");
        if (!timeValue) return setError("selectHour");
        if (!volume) return setError("invalidVolume");

        let vol = parseFloat(volume);
        if (unit === "mL") vol = vol / 1000;
        if (vol <= 0) return setError("invalidVolume");
        if (vol > 999.999) return setError("volumeTooHigh");


        if (checkConflict()) {
            setError("conflictProgramming");
            return;
        }

        try {
            setLoading(true);
            const timeStr = timeValue.format("HH:mm:ss");


            const { data: sessionData } = await supabase.auth.getSession();
            if (!sessionData?.session) {
                navigate("/dashboard", { replace: true });
                return;
            }

            const { error } = await supabase
                .from("programming_pumps")
                .insert({
                    pump: parseInt(selectedPump),
                    day_of_week: day,
                    clock: timeStr,
                    volume: vol
                });

            if (error) throw error;

            setSelectedPump("");
            setDay("monday");
            setTimeValue(null);
            setVolume("");
            setUnit("L");

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
                <h3>{texts.createProgrammingPump}</h3>
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
                        {pumpList.map(p => (
                            <option key={p.id} value={p.id}>
                                {p.name}
                            </option>
                        ))}
                    </select>

                    <label>{texts.days}</label>
                    <select
                        value={day}
                        onChange={(e) => setDay(e.target.value)}
                        disabled={loading}
                    >
                        {DAYS.map(d => (
                            <option key={d.value} value={d.value}>
                                {d.label}
                            </option>
                        ))}
                    </select>

                    <label>{texts.time}</label>

                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <TimePicker
                            label={texts.time}
                            value={timeValue}
                            onChange={(newValue) => setTimeValue(newValue)}
                            ampm={false}
                            minutesStep={1}
                            disabled={loading}
                        />
                    </LocalizationProvider>

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
                        <option value="L">L</option>
                        <option value="mL">mL</option>
                    </select>

                    <button type="submit" disabled={loading}>
                        {loading ? texts.creating : texts.createProgramming}
                    </button>

                    {error && (
                        <p style={{ color: "red" }}>
                            {texts[error] || error}
                        </p>
                    )}

                </form>
            </AccordionDetails>
        </Accordion>
    );
}