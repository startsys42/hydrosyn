
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

export default function TanksAccordion({ systemId }) {
    const navigate = useNavigate();
    const texts = useTexts();

    return (
        <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <h2>{texts.tankOptions}</h2>
            </AccordionSummary>
            <AccordionDetails>
                <h3>{texts.addTank}</h3>
                <h3>{texts.renameTank}</h3>
                <h3>{texts.removeTank}</h3>
            </AccordionDetails>
        </Accordion>
    );
}