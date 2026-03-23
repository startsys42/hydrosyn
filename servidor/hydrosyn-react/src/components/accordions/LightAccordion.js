// LightAccordion.jsx
import { useNavigate } from 'react-router-dom';
import useTexts from '../../utils/UseTexts';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import '../../styles/theme.css';


import { useState, useEffect } from "react";
import { supabase } from "../../utils/supabaseClient";
import { useRoleSystem } from "../../utils/RoleSystemContext";
import { useLanguage } from '../../utils/LanguageContext';
import CreateLight from '../LightComponents/CreateLight';
import DeleteLight from '../LightComponents/DeleteLight';
import UpdateLight from '../LightComponents/UpdateLight';
import ProgrammingLight from '../LightComponents/ProgrammingLight';
import ListRecordsLights from '../LightComponents/ListRecordsLights';


export default function LightAccordion({ systemId }) {
    const navigate = useNavigate();
    const texts = useTexts();
    const { role } = useRoleSystem();

    const [lightList, setLightList] = useState([]);
    const [programmingList, setProgrammingList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [errors, setErrors] = useState({
        create: "",
        update: "",
        delete: "",
        control: "",
        program: "",
        records: ""
    });

    const setComponentError = (component, msg) => {
        setErrors({
            create: "",
            update: "",
            delete: "",
            control: "",
            program: "",
            records: "",
            [component]: msg
        });
    };

    useEffect(() => {
        const fetchUser = async () => {
            const { data } = await supabase.auth.getUser();
            setCurrentUserId(data?.user?.id);
        };
        fetchUser();
    }, []);

    useEffect(() => {
        if (!currentUserId) return;
        fetchLights();
    }, [currentUserId]);

    useEffect(() => {
        if (!currentUserId || !systemId) return;
        fetchProgrammingList();
    }, [currentUserId, systemId]);

    const fetchLights = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('get_lights_for_system', {
                p_system_id: systemId,
                p_current_user: currentUserId
            });

            if (error) throw error;

            const formatted = (data || []).map(l => ({
                id: l.id,
                name: l.name,
                gpio: l.gpio,
                system: l.system_id,
                esp32: { id: l.esp32_id, name: l.esp32_name }
            }));

            setLightList(formatted);
        } catch (err) {
            console.error(err);
            setComponentError("create", err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchProgrammingList = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('get_programming_lights_for_system', {
                p_system_id: systemId,
                p_current_user: currentUserId
            });

            if (error) throw error;
            setProgrammingList(data || []);
        } catch (err) {
            setComponentError("program", err.message);
        } finally {
            setLoading(false);
        }
    };
    const fetchRecordsLights = async () => {
        // Esta función se llama cuando se eliminan registros
        // ListRecordsLights ya se refresca solo con su propio fetch
        console.log("Historial actualizado");
        // Si quieres que se refresque automáticamente, no necesitas hacer nada
        // Porque ListRecordsLights ya tiene su propio fetch
    };
    // Suscripciones en tiempo real
    useEffect(() => {
        if (!currentUserId || !systemId) return;

        const lightsSub = supabase
            .channel('lights-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'lights' }, () => fetchLights())
            .subscribe();

        const programmingSub = supabase
            .channel('programming-lights-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'programming_lights' }, () => fetchProgrammingList())
            .subscribe();

        return () => {
            supabase.removeChannel(lightsSub);
            supabase.removeChannel(programmingSub);
        };
    }, [currentUserId, systemId]);

    return (
        <div style={{ maxWidth: 800 }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <LightbulbIcon /> {texts.lights || "Luces"}
            </h2>

            {role === 'owner' && (
                <>
                    <CreateLight
                        systemId={systemId}
                        lightList={lightList}
                        refresh={fetchLights}
                        error={errors.create}
                        setError={(msg) => setComponentError("create", msg)}
                    />

                    <UpdateLight
                        systemId={systemId}
                        lightList={lightList}
                        refresh={fetchLights}
                        error={errors.update}
                        setError={(msg) => setComponentError("update", msg)}
                    />

                    <DeleteLight
                        systemId={systemId}
                        lightList={lightList}
                        refresh={fetchLights}
                        loading={loading}
                        error={errors.delete}
                        setError={(msg) => setComponentError("delete", msg)}
                    />
                </>
            )}



            {/* Programación de luces */}
            {role === 'owner' && (
                <ProgrammingLight
                    systemId={systemId}
                    lightList={lightList}
                    programmingList={programmingList}
                    refresh={fetchProgrammingList}
                    error={errors.program}
                    setError={(msg) => setComponentError("program", msg)}
                />
            )}

            {/* Historial de luces */}
            <ListRecordsLights
                systemId={systemId}
                refresh={fetchRecordsLights}  // ✅ Necesitas crear esta función
                userRole={role}                // ✅ Pasar el rol
                error={errors.records}         // ✅ Pasar el error
                setError={(msg) => setComponentError("records", msg)}  // ✅ Pasar setError
            />
        </div>
    );
}