import { useNavigate } from 'react-router-dom';
import useTexts from '../../utils/UseTexts';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import '../../styles/theme.css';
import { supabase } from "../../utils/supabaseClient";
import { useState, useEffect } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import 'moment/locale/es';



const localizer = momentLocalizer(moment);


export default function CalendarRecord() {

    const navigate = useNavigate();
    const texts = useTexts();

    const [events, setEvents] = useState([]);
    const [date, setDate] = useState(new Date());
    moment.locale(texts.language === "es" ? "es" : "en");




    const messages = texts.language === "es"
        ? {
            today: "Hoy",
            next: "Siguiente",
            previous: "Anterior",
            month: "Mes"
        }
        : {
            today: "Today",
            next: "Next",
            previous: "Back",
            month: "Month"
        };

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
        if (texts.language === 'es') {
            moment.locale('es');
        } else {
            moment.locale('en');
        }
    }, [texts.language]);
    useEffect(() => {
        fetchEvents();
    }, []);




    const eventStyleGetter = (event) => ({
        style: {
            backgroundColor: event.color,
            color: 'white'
        }
    });
    return (
        <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <h3>{texts.calendar}</h3>

            </AccordionSummary>
            <AccordionDetails>
                <div style={{ width: '100%' }}>
                    <Calendar
                        localizer={localizer}
                        events={events}
                        views={['month']}
                        defaultView="month"
                        date={date}
                        startAccessor="start"
                        endAccessor="end"
                        style={{ height: 500 }}
                        toolbar={true}
                        eventPropGetter={eventStyleGetter}

                        messages={messages}
                    />

                </div>
            </AccordionDetails>
        </Accordion>
    );

}