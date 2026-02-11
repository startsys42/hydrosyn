

//crear bomba eliminar bomba asociar bomba pines nombre, calibrar programar dar datos




import { useNavigate } from 'react-router-dom';
import useTexts from '../../utils/UseTexts';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import '../../styles/theme.css';
import DeleteTank from '../PumpComponents/DeletePump';
import CreateTank from '../PumpComponents/CreatePump';
import RenameTank from '../PumpComponents/UpdatePump';

import { useState, useEffect } from "react";
import { supabase } from "../../utils/supabaseClient";

export default function PumpsAccordion({ systemId }) {
    const navigate = useNavigate();
    const texts = useTexts();


    const [pumpList, setPumpList] = useState([]);
    const [loading, setLoading] = useState(false);

    const [errors, setErrors] = useState({
        create: "",
        rename: "",
        delete: ""
    });

    const setCreateError = (msg) => setErrors({ create: msg, update: "", delete: "" });
    const setUpdateError = (msg) => setErrors({ create: "", update: msg, delete: "" });
    const setDeleteError = (msg) => setErrors({ create: "", update: "", delete: msg });
    const fetchPumps = async () => {
        setLoading(true);
        setErrors({ create: "", update: "", delete: "" });
        try {
            const { data, error } = await supabase
                .from('pumps')
                .select(`
    id,
    name,
    gpio,
    system,
    origin (
      id,
      name
    ),
    destination (
      id,
      name
    ),
    esp32 (
      id,
      name
    )
  `)
                .eq('system', systemId);

            if (error) throw error;

            setPumpList(data || []);
        } catch (err) {
            console.error(err);
            setErrors({ create: err.message || "Error", update: "", delete: "" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPumps();
    }, [systemId]);

    return (
        <>
            <h2>{texts.pumps}</h2>

            <CreatePump
                systemId={systemId}
                pumpList={pumpList}
                refresh={fetchPumps}
                error={errors.create}
                setError={setCreateError}
            />

            <UpdatePump
                systemId={systemId}
                pumpList={pumpList}
                refresh={fetchPumps}
                error={errors.update}
                setError={setUpdateError}
            />


            <DeletePump
                systemId={systemId}
                pumpList={pumpList}
                refresh={fetchPumps}
                loading={loading}
                error={errors.delete}
                setError={setDeleteError}



            />
        </>
    );
}