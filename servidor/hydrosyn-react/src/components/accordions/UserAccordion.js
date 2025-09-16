import { useNavigate } from 'react-router-dom';
import useTexts from '../../utils/UseTexts';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import '../../styles/theme.css';

// añadir eliminar asociar activar desactivar eliminar de todo los sitemas
export default function UserAccordion() {
    const navigate = useNavigate();
    const texts = useTexts(); // ✅ ya no lo pasamos como prop

    return (
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
                    {texts.changePassword}
                </Button>
            </AccordionDetails>
        </Accordion>
    );
}