import { useState } from "react";


import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import useTexts from "../../utils/UseTexts";
import { supabase } from "../../utils/supabaseClient";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
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
    Box,
    Typography,
    Stack,
    IconButton
} from "@mui/material";
import InputAdornment from '@mui/material/InputAdornment';
import { Visibility, VisibilityOff } from '@mui/icons-material';


export default function ChangeSecretAccordion({ systemId, secret: initialSecret, refreshSecret, error, setError }) {
    const texts = useTexts();
    const [secret, setSecret] = useState(initialSecret || "");
    const [newSecret, setNewSecret] = useState("");
    const [showCurrentSecret, setShowCurrentSecret] = useState(false);
    const [showNewSecret, setShowNewSecret] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    
    const toggleShowCurrentSecret = () => setShowCurrentSecret(!showCurrentSecret);
    const toggleShowNewSecret = () => setShowNewSecret(!showNewSecret);

    useEffect(() => {
        setSecret(initialSecret || "");
    }, [initialSecret]);

    const handleSecretChange = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const { data: { session }, error: sessionErr } = await supabase.auth.getSession();
            if (sessionErr || !session || !session.user) {
                navigate("/dashboard");
                return;
            }
            const uid = session.user.id;


            const { data: adminData, error: adminErr } = await supabase
                .from('admin_users')
                .select('id')
                .eq('user', uid)
                .eq('is_active', true)
                .single();

            if (adminErr || !adminData) {
                navigate("/dashboard");
                return;
            }


            const { data: systemData, error: systemErr } = await supabase
                .from('systems')
                .select('id')
                .eq('id', systemId)
                .eq('admin', uid)
                .single();

            if (systemErr || !systemData) {

                navigate("/dashboard");
                return;
            }

            const codeRegex = /^[A-Za-z0-9]{10,30}$/;
            if (!codeRegex.test(newSecret)) {
                setError("regexSecretSystem");
                setLoading(false);
                return;
            }



            const { data: userSystems, error: systemsErr } = await supabase
                .from("systems")
                .select("id")
                .eq("admin", uid);

            if (systemsErr) throw systemsErr;

            const systemIds = userSystems.map(s => s.id);


            const { data: existingSecret, error: secretErr } = await supabase
                .from("system_secrets")
                .select("system")
                .in("system", systemIds)
                .eq("code", newSecret)
                .maybeSingle();

            if (existingSecret) {
                setError("repeatSecretSystem");
                setNewSecret("");
                setLoading(false);
                return;
            }

            const { error } = await supabase
                .from("system_secrets")
                .update({ code: newSecret })
                .eq("system", systemId);

            if (error) throw error;

            setSecret(newSecret);
            setNewSecret("");
            refreshSecret?.();


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
                    {texts.changeSecret}
                </Typography>
            </AccordionSummary>
            <AccordionDetails>
                <Box component="form" onSubmit={handleSecretChange} sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
                    <TextField
                        label={texts.currentSecret}
                        type={showCurrentSecret ? "text" : "password"}
                        value={secret}
                        required
                        fullWidth
                        InputProps={{
                            readOnly: true,
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton onClick={toggleShowCurrentSecret} edge="end">
                                        {showCurrentSecret ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                        inputProps={{ minLength: 10, maxLength: 30 }}
                        placeholder={texts.currentSecret}
                    />

                    <TextField
                        label={texts.newSecret}
                        type={showNewSecret ? "text" : "password"}
                        value={newSecret}
                        onChange={(e) => setNewSecret(e.target.value)}
                        required
                        fullWidth
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton onClick={toggleShowNewSecret} edge="end">
                                        {showNewSecret ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                        inputProps={{ minLength: 10, maxLength: 30 }}
                        placeholder={texts.newSecret}
                    />

                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        disabled={loading || !newSecret}
                        fullWidth
                    >
                        {texts.newSecret}
                    </Button>

                    {error && (
                        <Typography color="error" variant="body2" align="center">
                            {texts[error] || error}
                        </Typography>
                    )}
                </Box>
            </AccordionDetails>
        </Accordion>

    );
}