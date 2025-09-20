
// crear borrarvcambair nombre

import { useNavigate } from 'react-router-dom';
import useTexts from '../../utils/UseTexts';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import '../../styles/theme.css';

export default function TanksAccordion() {
    const navigate = useNavigate();
    const texts = useTexts(); // ✅ ya no lo pasamos como prop

    return (
        <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>{texts.tankOptions}</Typography>
            </AccordionSummary>
            <AccordionDetails>
                <h2>{texts.userManagement}</h2>
                <h2>{texts.createUser}</h2>
                <h2>{texts.deleteUser}</h2>
            </AccordionDetails>
        </Accordion>
    );
}