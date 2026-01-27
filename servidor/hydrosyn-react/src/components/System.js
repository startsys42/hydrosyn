
import { useNavigate } from 'react-router-dom';
import useTexts from '../utils/UseTexts';
import '../styles/theme.css';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import UserAccordion from './accordions/UserAccordion';
import NotificationsAccordion from './accordions/NotificationsAccordion';
import SettingsAccordion from './accordions/SettingsAccordion';
import ESP32Accordion from './accordions/ESP32Accordion';
import { useParams } from 'react-router-dom';
import { useOwnerStatus } from '../utils/OwnerContext';
import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useRoleSystem } from "../utils/RoleSystemContext";
import TanksAccordion from './accordions/TanksAccordion';

export default function System() {
    const navigate = useNavigate();
    const texts = useTexts();
    const { systemId } = useParams();
    const { role, loading: roleLoading } = useRoleSystem();
    const [selected, setSelected] = useState("");


    const [system, setSystem] = useState(null);
    const [loadingSystem, setLoadingSystem] = useState(true);

    const roleOptions = {
        owner: [
            { value: "tanks", label: texts.tanks },
            { value: "notifications", label: texts.notifications },
            { value: "users", label: texts.users },
            { value: "esp32", label: texts.esp32 },
            { value: "settings", label: texts.systemSettings }
        ],
        member: [
            { value: "notifications", label: texts.notifications },
            { value: "users", label: texts.users }
        ]
    };

    const options = roleOptions[role] || [];

    useEffect(() => {
        const fetchSystem = async () => {
            setLoadingSystem(true);
            const { data, error } = await supabase
                .from('systems')
                .select('name')
                .eq('id', systemId)
                .single();

            if (error) {

                setSystem(null); // Indica que no hay sistema
            } else if (data) {
                setSystem(data);
            }
            setLoadingSystem(false);
        };
        fetchSystem();
    }, [systemId]);
    const handleChange = (e) => {
        setSelected(e.target.value);
    }
    // Redirigir si no hay acceso
    useEffect(() => {
        if (!loadingSystem && !roleLoading) {
            if (!system || role === "none") {
                navigate('/dashboard', { replace: true });
            }
        }
    }, [system, role, loadingSystem, roleLoading, navigate]);

    // Esperar a que cargue el sistema y rol
    if (loadingSystem || roleLoading || !system || role === "none") return null;

    return (
        <div className='div-main-login'>
            <h1>{texts.system}: {system.name}</h1>
            <label htmlFor="options">{texts.options}</label>
            <br />
            <br />
            <select id="options" value={selected} onChange={handleChange}>
                <option value="">--  --</option>
                {options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>

            {selected === "tanks" && role === "owner" && <TanksAccordion systemId={systemId} />}
            {selected === "notifications" && role === "owner" && <NotificationsAccordion systemId={systemId} />}
            {selected === "users" && role === "owner" && <UserAccordion systemId={systemId} />}
            {selected === "esp32" && role === "owner" && <ESP32Accordion systemId={systemId} />}
            {selected === "settings" && role === "owner" && <SettingsAccordion systemId={systemId} />}









        </div>
    );
}
