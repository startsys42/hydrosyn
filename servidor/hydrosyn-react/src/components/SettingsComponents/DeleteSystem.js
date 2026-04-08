
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import useTexts from "../../utils/UseTexts";
import { supabase } from "../../utils/supabaseClient";

export default function DeleteSystem({ systemId, refresh, error, setError }) {
    const texts = useTexts();
    const navigate = useNavigate();
    const [openDialog, setOpenDialog] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleOpenDialog = () => {
        setError("");
        setOpenDialog(true);
    };

    const handleCloseDialog = () => setOpenDialog(false);

    const handleDelete = async () => {

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

            const { data, error: rpcError } = await supabase.rpc('delete_system', {
                system_id: systemId
            });

            if (rpcError) throw rpcError;

            refresh();
            navigate("/dashboard");

        } catch (err) {

            setError("Error" || err.message);
        } finally {
            setLoading(false);
            setOpenDialog(false);
        }
    };

    return (
        <>
            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <h3>{texts.deleteSystem}</h3>
                </AccordionSummary>
                <AccordionDetails>
                    <button onClick={handleOpenDialog}>
                        {texts.deleteSystem}
                    </button>


                </AccordionDetails>
            </Accordion>

            <Dialog open={openDialog} onClose={handleCloseDialog}>
                <DialogTitle>{texts.confirmation}</DialogTitle>
                <DialogContent>
                    <Typography>{texts.messageDeleteSystem}</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>{texts.no}</Button>
                    <Button onClick={handleDelete} variant="contained" color="error" disabled={loading}>
                        {texts.yes}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

