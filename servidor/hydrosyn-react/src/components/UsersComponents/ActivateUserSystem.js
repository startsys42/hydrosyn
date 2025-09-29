import { useState } from "react";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { DataGrid } from "@mui/x-data-grid";
import Checkbox from "@mui/material/Checkbox";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import useTexts from "../../utils/UseTexts";
import { supabase } from "../../utils/supabaseClient";
import { useNavigate } from "react-router-dom";

export default function ActivateUserSystem({
    systemId,
    users,
    refreshUsers,
    error: externalError,
    setError: setExternalError,
    loading: externalLoading
}) {

    const texts = useTexts();
    const [loading, setLoading] = useState(false);
    const [pageSize, setPageSize] = useState(10);
    const navigate = useNavigate();

    // --- Estados para diálogos ---
    const [openDialog, setOpenDialog] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [actionType, setActionType] = useState(null);

    const columns = [
        { field: 'email', headerName: texts.email, width: 250 },
        {
            field: 'is_active',
            headerName: texts.active,
            width: 150,
            renderCell: (params) => (
                <Checkbox
                    checked={params.value}
                    onChange={() => handleOpenDialog(params.row, "toggle")}
                />
            )
        },
        {
            field: 'actions',
            headerName: texts.deactiveAllSystems,
            sortable: false,
            disableColumnMenu: true,
            filterable: false,
            width: 150,
            renderCell: (params) => (
                <button style={{ padding: '4px 16px' }} onClick={() => handleOpenDialog(params.row, "deactivateAll")}>
                    {texts.deactivate}
                </button>
            )
        }
    ];


    const handleOpenDialog = (user, type) => {
        setCurrentUser(user);
        setActionType(type);
        setOpenDialog(true);
        setExternalError(""); // Limpiar errores de otros acordeones
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setCurrentUser(null);
        setActionType(null);
    };


    // --- Verificación de admin ---
    const checkAdmin = async () => {
        const { data: { user }, error: authErr } = await supabase.auth.getUser();
        if (authErr || !user) {
            navigate("/dashboard");
            return null;
        }

        const { data: adminData, error: adminErr } = await supabase
            .from('admin_users')
            .select('user, is_active')
            .eq('user', user.id)
            .eq('is_active', true)
            .single();

        if (adminErr || !adminData) {
            navigate("/dashboard");
            return null;
        }

        const { data: systemData, error: systemErr } = await supabase
            .from('systems')
            .select('id, admin')
            .eq('id', systemId)
            .eq('admin', user.id)
            .single();

        if (systemErr || !systemData) {
            navigate("/dashboard");
            return null;
        }

        return user;
    };
    // --- Ejecutar acción ---
    const handleConfirm = async () => {
        if (!currentUser || !actionType) return;
        setLoading(true);
        setExternalError("");
        const admin = await checkAdmin();
        if (!admin) return;
        try {
            if (actionType === "toggle") {
                // Activar/desactivar en este sistema
                const { data, error } = await supabase.rpc("active_user_associate_system", {
                    p_admin_uid: admin.id,
                    p_system_id: systemId,
                    p_user_id: currentUser.user_id
                });
                if (error) throw error;
            } else if (actionType === "deactivateAll") {
                // Desactivar en todos los sistemas
                const { data, error } = await supabase.rpc("deactivate_user_all_systems", {
                    p_admin_uid: admin.id,
                    p_system_id: systemId,
                    p_user_id: currentUser.user_id
                });
                if (error) throw error;
            }
            refreshUsers();
            handleCloseDialog();
        } catch (err) {
            setExternalError(err.message);
        } finally {
            setLoading(false);
        }
    };
    return (
        <>

            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>



                    <h3>{texts.activateUser}</h3>
                </AccordionSummary>
                <AccordionDetails>

                    <DataGrid className="datagrid"
                        rows={users.map(u => ({
                            id: u.user_id,   // único para DataGrid
                            user_id: u.user_id,
                            email: u.email,
                            is_active: u.is_active
                        }))}
                        columns={columns}
                        loading={loading || externalLoading}
                        pagination
                        pageSize={pageSize}
                        onPageSizeChange={setPageSize}
                        sortingMode="client"


                        disableSelectionOnClick
                    />
                </AccordionDetails>
            </Accordion>

            <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
                <DialogTitle>{texts.confirmation}</DialogTitle>
                <DialogContent>
                    {actionType === "toggle"
                        ? currentUser?.is_active
                            ? `${texts.deactivateUserThisSystemQuestion} ${currentUser?.email}?`
                            : `${texts.activateUserThisSystemQuestion} ${currentUser?.email}?`
                        : `${texts.deactivateUserAllSystemsQuestion} ${currentUser?.email}?`
                    }
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>{texts.no}</Button>
                    <Button onClick={handleConfirm} variant="contained" color="error" disabled={loading}>{texts.yes}</Button>
                </DialogActions>
            </Dialog>


        </>
    );
}

