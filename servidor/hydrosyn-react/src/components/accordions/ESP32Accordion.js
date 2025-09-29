import { useNavigate } from 'react-router-dom';
import useTexts from '../../utils/UseTexts';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import '../../styles/theme.css';
import { DataGrid } from '@mui/x-data-grid';
import { useState } from 'react';
import { useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import CreateESP32 from "../ESP32Components/CreateESP32";
import RenameESP32 from "../ESP32Components/RenameESP32.js";
import DeleteESP32 from "../ESP32Components/DeleteESP32";
// crear, borrar, cambiar nombre
//limite 2 esp32 sin rol


//registra esp32, 
// //eliminar 
// cambiar nombre, borrar con bombas y tanuqes, borra con estadistics sine stadistcas
export default function ESP32Accordion({ systemId }) {


    const navigate = useNavigate();
    const texts = useTexts();

    // Lista de ESP32
    const [espList, setEspList] = useState([]);
    const [loading, setLoading] = useState(false);
    // Errores locales por accordion
    const [errors, setErrors] = useState({
        create: '',
        rename: '',
        delete: ''
    });

    // Funciones para setear error de un accordion y limpiar los demás
    const setCreateError = (msg) => setErrors({ create: msg, rename: '', delete: '' });
    const setRenameError = (msg) => setErrors({ create: '', rename: msg, delete: '' });
    const setDeleteError = (msg) => setErrors({ create: '', rename: '', delete: msg });

    const fetchESP32 = async () => {
        setLoading(true);

        try {
            const { data, error } = await supabase
                .from('esp32')
                .select('id, name')
                .eq('system', systemId);

            if (error) throw error;

            setEspList(data || []);
        } catch (err) {
            console.error(err);
            setErrors(err.message || "Error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchESP32();
    }, [systemId]);

    return (
        <>
            <h2>{texts.esp32}</h2>
            <CreateESP32
                systemId={systemId}
                espList={espList}
                refresh={fetchESP32}
                error={errors.create}
                setError={setCreateError}
            />

            <RenameESP32
                systemId={systemId}
                espList={espList}
                refresh={fetchESP32}
                error={errors.rename}
                setError={setRenameError}
            />

            <DeleteESP32
                systemId={systemId}
                espList={espList}
                refresh={fetchESP32}
                loading={loading}
                error={errors.delete}
                setError={setDeleteError}
            />
        </>
    );
}