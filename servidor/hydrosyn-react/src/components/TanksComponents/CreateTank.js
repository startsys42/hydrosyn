import { useState } from "react";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import useTexts from "../../utils/UseTexts";
import { supabase } from "../../utils/supabaseClient";
import { useNavigate } from "react-router-dom";



export default function CreateTank({ systemId, tankList, refresh, error, setError }) {

    const navigate = useNavigate();
    const texts = useTexts();
    const [tankType, setTankType] = useState("");


    const [tankName, setTankName] = useState("");
    const [loading, setLoading] = useState(false);

    const handleCreateTank = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        if (!tankType) {
            setError(texts.selectTankType);
            setLoading(false);
            return;
        }



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


            const { data: tankCount, count, error: tankError } = await supabase
                .from("tanks")
                .select("*", { count: "exact" })
                .eq("system", systemId);

            if (tankError) throw tankError;


            if (count >= 20) {
                const { data: roleData, error: roleError } = await supabase
                    .from("roles")
                    .select("user")
                    .eq("user", user.id)
                    .maybeSingle();

                if (roleError) throw roleError;

                if (!roleData) {
                    setError(texts.limitTanks);
                    return;
                }
            }


            const nameRegex = /^[A-Za-z0-9][A-Za-z0-9_]{1,28}[A-Za-z0-9]$/;
            if (!nameRegex.test(tankName)) {
                setError("regexNameTanks");
                return;
            }


            const { data: existing, error: existError } = await supabase
                .from("tanks")
                .select("*")
                .eq("system", systemId)
                .eq("name", tankName);

            if (existError) throw existError;

            if (existing?.length > 0) {
                setError("repeatNameTanks");
                return;
            }


            const { data: insertData, error: insertError } = await supabase
                .from("tanks")
                .insert({ name: tankName, system: systemId, type: tankType })
                .select();

            if (insertError) throw insertError;

            setTankName("");
            setTankType("");

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
                    {texts.addTank}
                </Typography>
            </AccordionSummary>
            <AccordionDetails>
                <Box
                    component="form"
                    onSubmit={handleCreateTank}
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                        maxWidth: 400,
                        width: '100%'
                    }}
                >

                    <TextField
                        label={texts.nameTank}
                        placeholder={texts.nameTank}
                        variant="outlined"
                        value={tankName}
                        onChange={(e) => setTankName(e.target.value)}
                        required
                        fullWidth
                        inputProps={{
                            minLength: 3,
                            maxLength: 30
                        }}
                    />


                    <TextField
                        select
                        label={texts.selectTankType}
                        value={tankType}
                        onChange={(e) => setTankType(e.target.value)}
                        required
                        fullWidth
                        variant="outlined"
                    >

                        <MenuItem value="" disabled>
                            {texts.selectTankType}
                        </MenuItem>

                        {/* Las opciones de tu select */}
                        <MenuItem value="water">{texts.water}</MenuItem>
                        <MenuItem value="rotifers">{texts.rotifers}</MenuItem>
                        <MenuItem value="copepods">{texts.copepods}</MenuItem>
                        <MenuItem value="artemias">{texts.artemias}</MenuItem>
                        <MenuItem value="microalga">{texts.microalga}</MenuItem>
                        <MenuItem value="nutrients">{texts.nutrients}</MenuItem>
                    </TextField>


                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        disabled={loading}
                    >
                        {texts.addTank}
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
                <h3>{texts.addTank}</h3>
            </AccordionSummary>
            <AccordionDetails>
                <form onSubmit={handleCreateTank} className='form-container'>
                    <label>
                        {texts.nameTank}
                    </label>
                    <input
                        type="text"
                        value={tankName}
                        onChange={(e) => setTankName(e.target.value)}
                        required
                        minLength={3} maxLength={30}

                        placeholder={texts.nameTank}
                    />
                    <label>{texts.selectTankType}</label>
                    <select
                        value={tankType}
                        onChange={(e) => setTankType(e.target.value)}
                        required
                    >
                        <option value="" disabled>{texts.selectTankType}</option>
                        <option value="water">{texts.water}</option>
                        <option value="rotifers">{texts.rotifers}</option>
                        <option value="copepods">{texts.copepods}</option>
                        <option value="artemias">{texts.artemias}</option>
                        <option value="microalga">{texts.microalga}</option>
                        <option value="nutrients">{texts.nutrients}</option>
                    </select>

                    <button type="submit" disabled={loading}>{texts.addTank}</button>
                </form>
                {error && <p style={{ color: 'red' }}>{texts[error] || error}</p>}
            </AccordionDetails>
        </Accordion>
*/
    );


}