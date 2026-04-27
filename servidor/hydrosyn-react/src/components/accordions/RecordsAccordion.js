







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
    const [tankList, setTankList] = useState([]);
    const [recordList, setRecordList] = useState([]);
    const [loading, setLoading] = useState(false);

    const [errors, setErrors] = useState({
        create: "",
        delete: ""
    });

    const setCreateError = (msg) => setErrors({ create: msg, delete: "" });
    const setDeleteError = (msg) => setErrors({ create: "", delete: msg });


    const fetchTanks = async () => {
        try {
            const { data, error } = await supabase
                .from('tanks')
                .select('id, name, type')
                .eq('system', systemId);

            if (error) throw error;

            setTankList(data || []);
        } catch (err) {

        }
    };



    const fetchRecords = async () => {
        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();

            const { data, error } = await supabase.rpc('get_records_for_system', {
                p_system_id: systemId,
                p_current_user: user?.id
            });

            if (error) throw error;

            setRecordList(data || []);
        } catch (err) {


        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {

        const recordsChannel = supabase
            .channel('records-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'records' },
                payload => {
                    fetchRecords();
                }
            )
            .subscribe();

        const tanksChannel = supabase
            .channel('public:tanks')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'tanks', filter: `system=eq.${systemId}` },
                payload => {

                    fetchTanks();
                }
            )
            .subscribe();


        return () => {
            supabase.removeChannel(recordsChannel);
            supabase.removeChannel(tanksChannel);
        };
    }, [systemId]);
    useEffect(() => {
        fetchRecords();
        fetchTanks();
    }, [systemId]);
    return (
        <>
            <h2>{texts.records}</h2>

            <CreateRecord
                systemId={systemId}
                tankList={tankList}
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

        </>
    );
}