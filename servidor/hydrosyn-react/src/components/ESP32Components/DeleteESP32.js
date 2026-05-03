import { useState } from "react";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import useTexts from "../../utils/UseTexts";
import { supabase } from "../../utils/supabaseClient";
import { DataGrid } from "@mui/x-data-grid";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import { Delete as DeleteIcon } from "@mui/icons-material";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import { Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";



export default function DeleteESP32({ systemId, espList, refresh, loading, error, setError }) {
    const texts = useTexts();
    const [pageSize, setPageSize] = useState(10);
    const navigate = useNavigate()

    const [openDialog, setOpenDialog] = useState(false);
    const [selectedEsp, setSelectedEsp] = useState(null);

    const handleOpenDialog = (esp) => {
        setSelectedEsp(esp);
        setOpenDialog(true);
        setError("");
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedEsp(null);
    };

    const handleDelete = async () => {
        if (!selectedEsp) return;

        try {
            const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
            if (sessionError || !sessionData?.session) {

                navigate("/dashboard", { replace: true });
                return;
            }

            const uid = sessionData.session.user.id;


            const { data: adminUser, error: adminError } = await supabase
                .from("admin_users")
                .select("*")
                .eq("user", uid)
                .eq("is_active", true)
                .maybeSingle();

            if (adminError) {

                navigate("/dashboard", { replace: true });
                return;
            }

            if (!adminUser) {

                navigate("/dashboard", { replace: true });
                return;
            }


            const { data: systemData, error: systemError } = await supabase
                .from("systems")
                .select("*")
                .eq("id", systemId)
                .eq("admin", uid)
                .maybeSingle();

            if (systemError) {

                navigate("/dashboard", { replace: true });
                return;
            }

            if (!systemData) {

                navigate("/dashboard", { replace: true });
                return;
            }
            const { error } = await supabase
                .from("esp32")
                .delete()
                .eq("id", selectedEsp.id)
                .eq("system", systemId);

            if (error) throw error;

            refresh();
            handleCloseDialog();
        } catch (err) {

            setError("Error" || err.message);
        }
    };

    const columns = [
        { field: "name", headerName: texts.esp32, flex: 1, minWidth: 150 },
        {
            field: "delete",
            headerName: texts.delete,
            flex: 0.5,
            minWidth: 80,
            sortable: false,
            disableColumnMenu: true,
            filterable: false,
            renderCell: (params) => (
                <IconButton size="small" color="error" onClick={() => handleOpenDialog(params.row)}>
                    <DeleteIcon />
                </IconButton>
            ),
        },
    ];


    const rows = espList.map((esp) => ({ id: esp.id, name: esp.name }));
    return (
        <>
            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6" component="h3">
                        {texts.removeESP32}
                    </Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <div style={{ height: 500, width: '100%' }}>
                        <DataGrid className="datagrid"
                            rows={rows}
                            columns={columns}
                            loading={loading}
                            pagination
                            pageSize={pageSize}
                            onPageSizeChange={setPageSize}
                            sortingMode="client"
                            disableSelectionOnClick
                        />
                    </div>

                    {error && (
                        <Typography color="error" variant="body2" sx={{ mt: 2 }}>
                            {error}
                        </Typography>
                    )}
                </AccordionDetails>
            </Accordion>

            <Dialog open={openDialog} onClose={handleCloseDialog}>
                <DialogTitle>{texts.confirmation}</DialogTitle>
                <DialogContent>
                    <Typography>
                        {`${texts.deleteESP32Question} ${selectedEsp?.name}? ${texts.actionIrreversible}`}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>{texts.no}</Button>
                    <Button onClick={handleDelete} variant="contained" color="error">{texts.yes}</Button>
                </DialogActions>
            </Dialog>
        </>

        /*
        <>
            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <h3>{texts.removeESP32}</h3>
                </AccordionSummary>
                <AccordionDetails>
                    <div style={{ height: 500, width: '100%' }}>
                        <DataGrid className="datagrid"

                            rows={rows}
                            columns={columns}
                            loading={loading}
                            pagination
                            pageSize={pageSize}
                            onPageSizeChange={setPageSize}
                            sortingMode="client"


                            disableSelectionOnClick
                        />

                    </div>

                    {error && <p style={{ color: 'red' }}>{error}</p>}
                </AccordionDetails>
            </Accordion>

            <Dialog open={openDialog} onClose={handleCloseDialog}>
                <DialogTitle>{texts.confirmation}</DialogTitle>
                <DialogContent>
                    <Typography>
                        {`${texts.deleteESP32Question} ${selectedEsp?.name}? ${texts.actionIrreversible}`}
                    </Typography>

                </DialogContent>
                <DialogActions>

                    <Button onClick={handleCloseDialog}>{texts.no}</Button>
                    <Button onClick={handleDelete} variant="contained" color="error">{texts.yes}</Button>
                </DialogActions>
            </Dialog>
        </>
        */
    );
}