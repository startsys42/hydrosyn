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
import Typography from '@mui/material/Typography';
import { IconButton, Radio, RadioGroup, FormControlLabel, FormControl } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

export default function DeleteUserSystem({
    systemId,
    users,
    refreshUsers,
    refreshAvailable,
    error: externalError,
    setError: setExternalError,
    loading: externalLoading
}) {

    const texts = useTexts();
    const [loading, setLoading] = useState(false);
    const [pageSize, setPageSize] = useState(10);
    const [openDialog, setOpenDialog] = useState(false);
    const [deleteAllSystems, setDeleteAllSystems] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const navigate = useNavigate();


    const handleOpenDialog = (user) => {
        setCurrentUser(user);
        setDeleteAllSystems(false);
        setOpenDialog(true);
        setExternalError("");
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setCurrentUser(null);
        setDeleteAllSystems(false);
    };

    const columns = [
        { field: "email", headerName: texts.email, flex: 1, minWidth: 250 },
        {
            field: 'actions',
            headerName: texts.delete,
            sortable: false,
            disableColumnMenu: true,
            filterable: false,
            width: 100,
            renderCell: (params) => (
                <IconButton color="error" onClick={() => handleOpenDialog(params.row)}>
                    <DeleteIcon />
                </IconButton>
            )
        }
    ];


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


    const handleDelete = async () => {
        const admin = await checkAdmin();
        if (!admin) return;
        if (!currentUser) return;
        setLoading(true);
        setExternalError("");


        try {
            const { data, error } = await supabase.rpc("delete_user_system", {
                p_admin_uid: admin.id,
                p_system_id: systemId,
                p_user_id: currentUser.userId,
                p_delete_all: deleteAllSystems
            });


            if (error) throw error;

            refreshUsers();
            refreshAvailable();
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
                    <Typography variant="h6" component="h3">{texts.deleteUser}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <div style={{ height: 500, width: '100%' }}>
                        <DataGrid className="datagrid"
                            rows={users.map(u => ({
                                id: u.id,
                                userId: u.user_id,
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
                    </div>
                </AccordionDetails>
            </Accordion>
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
                <DialogTitle>{texts.confirmation}</DialogTitle>
                <DialogContent>
                    <Typography gutterBottom>
                        {deleteAllSystems
                            ? `${texts.deleteUserAllSystemsQuestion} ${currentUser?.email}?`
                            : `${texts.deleteUserQuestion} ${currentUser?.email}?`
                        }
                    </Typography>
                    <FormControl component="fieldset" sx={{ mt: 2 }}>
                        <RadioGroup
                            value={deleteAllSystems ? "all" : "this"}
                            onChange={(e) => setDeleteAllSystems(e.target.value === "all")}
                        >
                            <FormControlLabel value="this" control={<Radio />} label={texts.delete} />
                            <FormControlLabel value="all" control={<Radio />} label={texts.deleteAllSystems} />
                        </RadioGroup>
                    </FormControl>
                    <Typography color="error" variant="body2" sx={{ mt: 2, fontWeight: 'bold' }}>
                        {texts.actionIrreversible}
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

