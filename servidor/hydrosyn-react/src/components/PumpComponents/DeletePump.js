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





export default function DeletePump({ systemId, pumpList, refresh, loading, error, setError }) {


    const texts = useTexts();
    const [pageSize, setPageSize] = useState(10);
    const navigate = useNavigate()

    const [openDialog, setOpenDialog] = useState(false);
    const [selectedPump, setSelectedPump] = useState(null);

    const handleOpenDialog = (pump) => {
        setSelectedPump(pump);
        setOpenDialog(true);
        setError(""); // limpiar error antes de abrir
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedPump(null);
    };

    const handleDelete = async () => {
        if (!selectedPump) return;

        try {
            const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
            if (sessionError || !sessionData?.session) {

                navigate("/dashboard", { replace: true });
                return;
            }

            const uid = sessionData.session.user.id;

            // Verificar que el usuario está activo en admin_users
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

            // Verificar que el usuario es admin del sistema correspondiente
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
                .from("pumps")
                .delete()
                .eq("id", selectedPump.id)
                .eq("system", systemId);

            if (error) throw error;

            refresh(); // refresca la lista en el padre
            handleCloseDialog();
        } catch (err) {

            setError("Error" || err.message);
        }
    };

    const columns = [
        { field: "name", headerName: texts.pump, width: 250 },
        { field: "esp32Name", headerName: texts.esp32, width: 150 },
        { field: "originName", headerName: texts.originTank, width: 150 },
        { field: "destinationName", headerName: texts.destinationTank, width: 150 },
        {
            field: "delete",
            headerName: texts.delete,
            width: 150,
            sortable: false,
            disableColumnMenu: true,
            filterable: false,
            renderCell: (params) => (
                <button
                    onClick={() => handleOpenDialog(params.row)}
                    style={{ padding: "4px 12px" }}
                >
                    {texts.delete}
                </button>
            ),
        },
    ];

    // DataGrid necesita que cada fila tenga id único
    const rows = pumpList.map((pump) => ({
        id: pump.id,
        name: pump.name,
        esp32Name: pump.esp32?.name || "-",
        originName: pump.origin?.name || "-",
        destinationName: pump.destination?.name || "-",
    }));
    return (
        <>
            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <h3>{texts.removePump}</h3>
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
            {/* Dialogo de confirmación */}
            <Dialog open={openDialog} onClose={handleCloseDialog}>
                <DialogTitle>{texts.confirmation}</DialogTitle>
                <DialogContent>
                    <Typography>
                        {`${texts.deletePumpQuestion} ${selectedPump?.name}? ${texts.actionIrreversible}`}
                    </Typography>

                </DialogContent>
                <DialogActions>

                    <Button onClick={handleCloseDialog}>{texts.no}</Button>
                    <Button onClick={handleDelete} variant="contained" color="error" disabled={loading}>{texts.yes}</Button>
                </DialogActions>
            </Dialog>
        </>
    );
}