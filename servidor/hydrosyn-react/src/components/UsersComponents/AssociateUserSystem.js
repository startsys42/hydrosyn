


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
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Typography from '@mui/material/Typography';

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
        setLoading(true);
        try {
            const admin = await checkAdmin();
            if (!admin) {
                setLoading(false);
                return;
            }
            setCurrentAdmin(admin);


            const { count, error: countErr } = await supabase
                .from("systems_users")
                .select("*", { count: 'exact', head: true })
                .eq("system", systemId);

            if (countErr) throw new Error(countErr.message);


            if (count >= 5) {
                const { data: rolesData, error: rolesErr } = await supabase
                    .from("roles")
                    .select("user")
                    .eq("user", admin.id)
                    .maybeSingle();

                if (rolesErr) throw new Error(rolesErr.message);

                if (!rolesData) {
                    setExternalError("limitUsers");
                    setLoading(false);
                    return;
                }
            }
            setCurrentUser({
                user_id: user.user_id,
                email: user.email
            });
            setOpenDialog(true);
        } catch (err) {
            setExternalError("Error" || err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setCurrentUser(null);
    };

    const handleAssociate = async () => {
        setExternalError('');
        if (!currentUser || !currentAdmin) return;
        setLoading(true);

        try {

            const { data, error } = await supabase.rpc("associate_user_to_system", {
                p_admin_uid: currentAdmin.id,
                p_system_id: systemId,
                p_user_id: currentUser.user_id
            });

            if (error) throw error;


            if (refreshUsers) await refreshUsers();
            if (refreshAvailable) await refreshAvailable();

            handleCloseDialog();
        } catch (err) {
            setExternalError("Error" || err.message);
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        { field: "email", headerName: texts.email, flex: 1, minWidth: 250 },
        {
            field: "associate",
            headerName: texts.associate,
            sortable: false,
            filterable: false,
            disableColumnMenu: true,
            flex: 1,
            renderCell: (params) => (
                <IconButton
                    color="primary"
                    onClick={() => handleOpenDialog(params.row)}
                    disabled={loading || externalLoading}
                    title={texts.associate}
                >
                    <PersonAddIcon />
                </IconButton>
            ),

        }
    ];

    return (
        <>

            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6" component="h3">{texts.associateUser}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    {externalError && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {texts[externalError] || externalError}
                        </Alert>
                    )}
                    <div style={{ height: 500, width: '100%' }}>
                        <DataGrid
                            rows={(availableUsers || []).map(u => ({
                                id: u.user_id,
                                user_id: u.user_id,
                                email: u.email
                            }))}
                            columns={columns}
                            loading={externalLoading}
                            pagination
                            pageSize={pageSize}
                            onPageSizeChange={setPageSize}
                            sortingMode="client"


                            disableSelectionOnClick
                        />
                    </div>
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

