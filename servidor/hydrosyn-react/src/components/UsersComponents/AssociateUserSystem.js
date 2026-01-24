


import { useState } from "react";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import useTexts from "../../utils/UseTexts";
import { supabase } from "../../utils/supabaseClient";
import { useNavigate } from "react-router-dom";
import { DataGrid } from '@mui/x-data-grid';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';

export default function AssociateUserSystem({
    systemId,
    availableUsers,
    refreshUsers,
    refreshAvailable,
    error: externalError,
    setError: setExternalError,
    loading: externalLoading
}) {
    const texts = useTexts();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [pageSize, setPageSize] = useState(10);
    const [currentAdmin, setCurrentAdmin] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    const checkAdmin = async () => {
        const { data: { user }, error: authErr } = await supabase.auth.getUser();
        if (authErr || !user) { navigate("/dashboard"); return null; }

        const { data: adminData, error: adminErr } = await supabase
            .from('admin_users')
            .select('user, is_active')
            .eq('user', user.id)
            .eq('is_active', true)
            .single();

        if (adminErr || !adminData) { navigate("/dashboard"); return null; }

        const { data: systemData, error: systemErr } = await supabase
            .from('systems')
            .select('id, admin')
            .eq('id', systemId)
            .eq('admin', user.id)
            .single();

        if (systemErr || !systemData) { navigate("/dashboard"); return null; }

        return user;
    };

    const handleOpenDialog = async (user) => {
        setExternalError('');
        try {
            const admin = await checkAdmin();
            if (!admin) return;
            setCurrentAdmin(admin);
            const { data: associatedUsers, error: associatedErr } = await supabase
                .from("systems_users")
                .select("user_id")
                .eq("system", systemId);

            if (associatedErr) throw new Error(associatedErr.message)

            if (associatedUsers.length >= 5) {
                const { data: rolesData, error: rolesErr } = await supabase
                    .from("roles")
                    .select("user")
                    .eq("user", admin.id);

                if (rolesErr) throw new Error(rolesErr.message);

                const isAdminAuthorized = rolesData.length > 0;
                if (!isAdminAuthorized) {
                    setExternalError("limitUsers");
                    return;
                }
            }

            setCurrentUser(user);
            setOpenDialog(true);
        } catch (err) {
            setExternalError("Error" || err.message);
        }
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setCurrentUser(null);
    };

    const handleAssociate = async () => {
        setExternalError(''); // limpia errores del padre antes de ejecutar
        if (!currentUser || !currentAdmin) return;
        setLoading(true);

        try {
            const { data, error } = await supabase.rpc("associate_user_to_system", {
                p_admin_uid: currentAdmin.id,
                p_system_id: systemId,
                p_user_id: currentUser.user_id
            });

            if (error) throw error;

            refreshUsers();
            refreshAvailable();
            handleCloseDialog();
        } catch (err) {
            setExternalError("Error" || err.message);
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        { field: "email", headerName: texts.email, width: 250 },
        {
            field: "associate",
            headerName: texts.associate,
            sortable: false,
            filterable: false,
            disableColumnMenu: true,
            width: 150,
            renderCell: (params) => (
                <button
                    onClick={() => handleOpenDialog(params.row)}
                    style={{ padding: "4px 12px" }}
                >
                    {texts.associate}
                </button>
            ),

        }
    ];

    return (
        <>

            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <h3>{texts.associateUser}</h3>
                </AccordionSummary>
                <AccordionDetails>
                    <DataGrid
                        rows={(availableUsers || []).map(u => ({ id: u.user_id, email: u.email }))}
                        columns={columns}
                        loading={loading || externalLoading}
                        pagination
                        pageSize={pageSize}
                        onPageSizeChange={setPageSize}
                        sortingMode="client"


                        disableSelectionOnClick
                    />

                    {externalError && <p style={{ color: 'red' }}>{texts[externalError] || externalError}</p>}
                </AccordionDetails>
            </Accordion>
            <Dialog open={openDialog} onClose={handleCloseDialog}>
                <DialogTitle>{texts.confirmation}</DialogTitle>
                <DialogContent>
                    {`${texts.associateUserQuestion} ${currentUser?.email}?`}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>{texts.no}</Button>
                    <Button onClick={handleAssociate} variant="contained" color="error" disabled={loading}>{texts.yes}</Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

