

import { useNavigate } from 'react-router-dom';
import useTexts from '../utils/UseTexts';
import '../styles/theme.css';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

export default function System() {
    const navigate = useNavigate();
    const texts = useTexts();

    return (
        <div className='div-main-login'>
            <h1>{texts.systems}</h1>

            {/* Accordion para Diseño */}
            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>{texts.usersOptions}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Button
                        variant="contained"
                        color="primary"
                        fullWidth
                        onClick={() => navigate('/design')}
                    >
                        {texts.changePassword} {/* Puedes cambiar el texto */}
                    </Button>
                </AccordionDetails>
            </Accordion>

            {/* Accordion para Email / Configuración */}
            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>{texts.notifications}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Button
                        variant="contained"
                        color="secondary"
                        fullWidth
                        onClick={() => navigate('/change-email')}
                    >
                        {texts.changeEmail}
                    </Button>
                </AccordionDetails>
            </Accordion>


            {/* Diseño */}
            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>{texts.design}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Button variant="contained" fullWidth onClick={() => navigate('/design')}>
                        {texts.changeDesign}
                    </Button>
                </AccordionDetails>
            </Accordion>

            {/* ESP32 */}
            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>{texts.esp32}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Button variant="outlined" fullWidth style={{ marginBottom: 10 }}>
                        {texts.addESP32}
                    </Button>
                    <Button variant="outlined" fullWidth>
                        {texts.removeESP32}
                    </Button>
                </AccordionDetails>
            </Accordion>

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
            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>{texts.systemSettings}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Button variant="outlined" fullWidth style={{ marginBottom: 10 }}>
                        {texts.renameSystem}
                    </Button>
                    <Button variant="outlined" fullWidth color="error">
                        {texts.deleteSystem}
                    </Button>
                </AccordionDetails>
            </Accordion>
        </div>
    );
}
