import { useNavigate } from 'react-router-dom';
import useTexts from '../../utils/UseTexts';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import '../../styles/theme.css';

// se recargue,..., añadir datos, los colores de eventos,...
export default function CalendarAccordion() {
    const navigate = useNavigate();
    const texts = useTexts(); // ✅ ya no lo pasamos como prop

    const [events, setEvents] = useState([]);

    // Función para recargar los eventos desde Supabase
    const fetchEvents = async () => {
        const { data, error } = await supabase.from('events').select('*');
        if (!error) {
            const formatted = data.map(e => ({
                ...e,
                start: new Date(e.start),
                end: new Date(e.end),
                title: e.title,
                color: e.color || 'blue'
            }));
            setEvents(formatted);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    // Añadir evento al seleccionar un rango en el calendario
    const handleSelectSlot = async ({ start, end }) => {
        const title = prompt('Título del evento:');
        if (!title) return;
        const color = prompt('Color del evento (red, green, blue, etc.):', 'blue');

        const { data, error } = await supabase
            .from('events')
            .insert([{ title, start, end, color }])
            .select();

        if (!error) {
            setEvents([...events, { ...data[0], start: new Date(data[0].start), end: new Date(data[0].end) }]);
        }
    };

    // Estilo de eventos por color
    const eventStyleGetter = (event) => ({
        style: {
            backgroundColor: event.color,
            color: 'white'
        }
    });
    return (
        <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>{texts.calendar}</Typography>
            </AccordionSummary>
            <AccordionDetails>
                <div style={{ width: '100%' }}>
                    <Calendar
                        localizer={localizer}
                        events={events}
                        startAccessor="start"
                        endAccessor="end"
                        style={{ height: 500 }}
                        selectable
                        onSelectSlot={handleSelectSlot} // para añadir eventos
                        eventPropGetter={eventStyleGetter} // colorear eventos
                    />
                    <button onClick={fetchEvents} style={{ marginTop: '10px' }}>
                        Recargar calendario
                    </button>
                </div>
            </AccordionDetails>
        </Accordion>
    );
}