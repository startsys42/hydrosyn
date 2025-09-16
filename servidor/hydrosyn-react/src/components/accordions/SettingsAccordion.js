import { useNavigate } from 'react-router-dom';
import useTexts from '../../utils/UseTexts';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import '../../styles/theme.css';


//borrar sistema, cambiarle el nombre

//borar sistema implica eliminar todos sus datos

export default function SettingsAccordion() {
    const navigate = useNavigate();
    const texts = useTexts(); // ✅ ya no lo pasamos como prop

    return (
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
    );
}