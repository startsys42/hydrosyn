
import { useState } from "react";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import useTexts from "../../utils/UseTexts";
import { supabase } from "../../utils/supabaseClient";
import { useNavigate } from "react-router-dom";
import { DataGrid } from "@mui/x-data-grid";

import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from "@mui/material";

export default function DeleteLight({ systemId, lightList, refresh, loading, error, setError }) {
    const texts = useTexts();
    const [pageSize, setPageSize] = useState(10);
    const navigate = useNavigate();

    const [openDialog, setOpenDialog] = useState(false);
    const [selectedLight, setSelectedLight] = useState(null);

    const handleOpenDialog = (light) => {
        setSelectedLight(light);
        setOpenDialog(true);
        setError("");
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedLight(null);
    };

    const handleDelete = async () => {
        if (!selectedLight) return;

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

            if (adminError || !adminUser) {
                navigate("/dashboard", { replace: true });
                return;
            }


            const { data: systemData, error: systemError } = await supabase
                .from("systems")
                .select("*")
                .eq("id", systemId)
                .eq("admin", uid)
                .maybeSingle();

            if (systemError || !systemData) {
                navigate("/dashboard", { replace: true });
                return;
            }




            const { error } = await supabase
                .from("lights")
                .delete()
                .eq("id", selectedLight.id)
                .eq("system", systemId);

            if (error) throw error;


            refresh();
            handleCloseDialog();

        } catch (err) {

            setError("Error" || err.message);
            handleCloseDialog();
        }
    };

    const columns = [
        {
            field: "name",
            headerName: texts.lights,
            width: 200
        },
        {
            field: "esp32Name",
            headerName: texts.esp32,
            width: 150
        },
        {
            field: "gpio",
            headerName: texts.GPIO,
            width: 100
        },
        {
            field: "delete",
            headerName: texts.delete,
            width: 120,
            sortable: false,
            disableColumnMenu: true,
            filterable: false,
            renderCell: (params) => (
                <button
                    onClick={() => handleOpenDialog(params.row)}
                    style={{ padding: "4px 12px", cursor: "pointer" }}
                >
                    {texts.delete}
                </button>
            ),
        },
    ];


    const rows = (lightList || []).map((light) => ({
        id: light.id,
        name: light.name,
        esp32Name: light.esp32?.name || "-",
        gpio: light.gpio || "-",
    }));

    return (
        <>
            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <h3>{texts.removeLight}</h3>
                </AccordionSummary>
                <AccordionDetails>
                    <div style={{ height: 400, width: '100%' }}>
                        <DataGrid
                            className="datagrid"
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
                    {error && <p style={{ color: 'red', marginTop: 16 }}>{error}</p>}
                </AccordionDetails>
            </Accordion>


            <Dialog open={openDialog} onClose={handleCloseDialog}>
                <DialogTitle>{texts.confirmation}</DialogTitle>
                <DialogContent>
                    <Typography>

                        {`${texts.deleteLightQuestion} ${selectedLight?.name}?  ${texts.actionIrreversible}`}

                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>
                        {texts.no}
                    </Button>
                    <Button
                        onClick={handleDelete}
                        variant="contained"
                        color="error"
                        disabled={loading}
                    >
                        {texts.yes}
                    </Button>
                </DialogActions>
            </Dialog >
        </>
    );
}