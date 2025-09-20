
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


export default function System() {
    const navigate = useNavigate();
    const texts = useTexts();
    const { id } = useParams();
    const [system, setSystem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { isOwner, loading: ownerLoading } = useOwnerStatus();

    useEffect(() => {
        const fetchSystem = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('systems')      // nombre de tu tabla
                .select('name')       // columna que quieres
                .eq('id', id)         // filtrar por id
                .single();            // devuelve un solo objeto

            if (error) {
                setError(error.message);
            } else {
                setSystem(data);
            }
            setLoading(false);
        };

        fetchSystem();
    }, [id]);
    return (
        <div className='div-main-login'>
            <h1>{texts.systems}: {system.name}</h1>


            {isOwner ? (<UserAccordion />) : null}
            {isOwner ? (<NotificationsAccordion />) : null}




            {/* ESP32 */}
            <ESP32Accordion />

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

            {/* Sistema */}
            {isOwner ? (<SettingsAccordion systemId={id} />) : null}
        </div>
    );
}
