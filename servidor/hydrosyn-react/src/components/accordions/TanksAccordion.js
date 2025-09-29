
// crear borrarvcambair nombre

import { useNavigate } from 'react-router-dom';
import useTexts from '../../utils/UseTexts';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import '../../styles/theme.css';
import DeleteTank from '../TanksComponents/DeleteTank';
import CreateTank from '../TanksComponents/CreateTank';
import RenameTank from '../TanksComponents/RenameTank';

import { useState, useEffect } from "react";
import { supabase } from "../../utils/supabaseClient";

export default function TanksAccordion({ systemId }) {
    const navigate = useNavigate();
    const texts = useTexts();


    const [tankList, setTankList] = useState([]);
    const [loading, setLoading] = useState(false);

    const [errors, setErrors] = useState({
        create: "",
        rename: "",
        delete: ""
    });

    const setCreateError = (msg) => setErrors({ create: msg, rename: "", delete: "" });
    const setRenameError = (msg) => setErrors({ create: "", rename: msg, delete: "" });
    const setDeleteError = (msg) => setErrors({ create: "", rename: "", delete: msg });
    const fetchTanks = async () => {
        setLoading(true);
        setErrors({ create: "", rename: "", delete: "" });
        try {
            const { data, error } = await supabase
                .from('tanks')
                .select('id, name, type')
                .eq('system', systemId);

            if (error) throw error;

            setTankList(data || []);
        } catch (err) {
            console.error(err);
            setErrors({ create: err.message || "Error", rename: "", delete: "" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTanks();
    }, [systemId]);

    return (
        <>
            <h2>{texts.tanks}</h2>

            <CreateTank
                systemId={systemId}
                tankList={tankList}
                refresh={fetchTanks}
                error={errors.create}
                setError={setCreateError}
            />

            <RenameTank
                systemId={systemId}
                tankList={tankList}
                refresh={fetchTanks}
                error={errors.rename}
                setError={setRenameError}
            />

            <DeleteTank
                systemId={systemId}
                tankList={tankList}
                refresh={fetchTanks}
                loading={loading}
                error={errors.delete}
                setError={setDeleteError}
            />
        </>
    );
}