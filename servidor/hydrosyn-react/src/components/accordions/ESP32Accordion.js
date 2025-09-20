import { useNavigate } from 'react-router-dom';
import useTexts from '../../utils/UseTexts';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import '../../styles/theme.css';

//registra esp32, eliminar cambiar nombre, borrar con bombas y tanuqes, borra con estadistics sine stadistcas
export default function ESP32Accordion() {
    const navigate = useNavigate();
    const texts = useTexts(); // ✅ ya no lo pasamos como prop

    return (
        <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>{texts.esp32}</Typography>
            </AccordionSummary>
            <AccordionDetails>
                {/* Acordeón interno: Crear ESP32 */}
                <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography>{texts.addESP32}</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        {/* Aquí puedes poner tu formulario o lógica para crear un ESP32 */}
                        <Typography>Formulario para registrar un ESP32</Typography>
                    </AccordionDetails>
                </Accordion>

                {/* Acordeón interno: Eliminar ESP32 */}
                <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography>{texts.removeESP32}</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        {/* Aquí puedes poner tu lógica para eliminar */}
                        <Typography>Seleccionar y eliminar ESP32</Typography>
                    </AccordionDetails>
                </Accordion>

                {/* Acordeón interno: Cambiar nombre ESP32 */}
                <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography>{texts.renameESP32}</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        {/* Aquí tu lógica para cambiar nombre */}
                        <Typography>Formulario para renombrar ESP32</Typography>
                    </AccordionDetails>
                </Accordion>
            </AccordionDetails>
        </Accordion>
    );
}
