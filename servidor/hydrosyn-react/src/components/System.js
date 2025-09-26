
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


    const [system, setSystem] = useState(null);
    const [loadingSystem, setLoadingSystem] = useState(true);

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
            <h1>{texts.systems}: {system.name}</h1>

            {role === "owner" && <TanksAccordion systemId={systemId} />}
            {role === "owner" && <NotificationsAccordion systemId={systemId} />}
            {role === "owner" && <UserAccordion systemId={systemId} />}
            {role === "owner" && <ESP32Accordion systemId={systemId} />}
            {role === "owner" && <SettingsAccordion systemId={systemId} />}





            {/* Tanques */}
            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>{texts.tanks}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Button variant="outlined" fullWidth style={{ marginBottom: 10 }}>
                        {texts.addTank}
                    </Button>
                    <Button variant="outlined" fullWidth>
                        {texts.removeTank}
                    </Button>
                </AccordionDetails>
            </Accordion>

            {/* Bombas peristálticas */}
            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>{texts.pumps}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Button variant="outlined" fullWidth style={{ marginBottom: 10 }}>
                        {texts.addPump}
                    </Button>
                    <Button variant="outlined" fullWidth>
                        {texts.removePump}
                    </Button>
                </AccordionDetails>
            </Accordion>

            {/* Luces */}
            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>{texts.lights}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Button variant="outlined" fullWidth style={{ marginBottom: 10 }}>
                        {texts.addLight}
                    </Button>
                    <Button variant="outlined" fullWidth>
                        {texts.removeLight}
                    </Button>
                </AccordionDetails>
            </Accordion>

            {/* Cámaras */}
            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>{texts.cameras}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Button variant="outlined" fullWidth style={{ marginBottom: 10 }}>
                        {texts.addCamera}
                    </Button>
                    <Button variant="outlined" fullWidth>
                        {texts.removeCamera}
                    </Button>
                </AccordionDetails>
            </Accordion>

            {/* Calendario */}
            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>{texts.calendar}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Button variant="contained" fullWidth onClick={() => navigate('/calendar')}>
                        {texts.viewCalendar}
                    </Button>
                </AccordionDetails>
            </Accordion>

            {/* Registros manuales */}
            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>{texts.manualRecords}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Button variant="contained" fullWidth onClick={() => navigate('/manual-records')}>
                        {texts.viewManualRecords}
                    </Button>
                </AccordionDetails>
            </Accordion>


        </div>
    );
}
