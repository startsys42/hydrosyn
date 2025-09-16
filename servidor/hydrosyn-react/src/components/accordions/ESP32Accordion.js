import { useNavigate } from 'react-router-dom';
import useTexts from '../../utils/UseTexts';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import '../../styles/theme.css';

//registra esp32, eliminar cambiar nombre
export default function ESP32Accordion() {
    const navigate = useNavigate();
    const texts = useTexts(); // ✅ ya no lo pasamos como prop

    return (
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
    );
}