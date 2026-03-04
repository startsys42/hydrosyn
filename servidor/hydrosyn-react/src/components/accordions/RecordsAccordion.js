// agau y vaciados, editarlos, insertar, borara actualizar calendario







import { useNavigate } from 'react-router-dom';
import useTexts from '../../utils/UseTexts';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import '../../styles/theme.css';
import CalendarRecord from '../RecordComponents/CalendarRecord';
import ListRecords from '../RecordComponents/ListRecords';
import CreateRecord from '../RecordComponents/CreateRecord';
import { useRoleSystem } from "../../utils/RoleSystemContext";


import { useState, useEffect } from "react";
import { supabase } from "../../utils/supabaseClient";

export default function RecordsAccordion({ systemId }) {
    const navigate = useNavigate();
    const texts = useTexts();
    const { role } = useRoleSystem();

    const [recordList, setRecordList] = useState([]);
    const [loading, setLoading] = useState(false);

    const [errors, setErrors] = useState({
        create: "",
        update: "",
        delete: ""
    });

    const setCreateError = (msg) => setErrors({ create: msg, update: "", delete: "" });
    const setDeleteError = (msg) => setErrors({ create: "", update: "", delete: msg });
    const fetchRecords = async () => {
        setLoading(true);
        setErrors({ create: "", update: "", delete: "" });
        try {
            const { data, error } = await supabase
                .from('records')
                .select(`
                id,
                created_at,
                volume,
                tank (
                    id,
                    name,
                    type,
                    system
                )
            `)
                .eq('tank.system', systemId)

            if (error) throw error;

            setRecordList(data || []);
        } catch (err) {
            console.error(err);
            setErrors({ create: err.message || "Error", delete: "" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecords();
    }, [systemId]);

    return (
        <>
            <h2>{texts.records}</h2>

            <CreateRecord
                systemId={systemId}
                recordList={recordList}
                refresh={fetchRecords}
                error={errors.create}
                setError={setCreateError}
            />




            <ListRecords
                systemId={systemId}
                recordList={recordList}
                refresh={fetchRecords}
                loading={loading}
                userRole={role}
                error={errors.delete}
                setError={setDeleteError}



            />
            <CalendarRecord
                systemId={systemId}
                recordList={recordList}
                refresh={fetchRecords}
                loading={loading}
            />
        </>
    );
}