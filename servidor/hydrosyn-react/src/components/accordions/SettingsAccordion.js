import { useNavigate } from 'react-router-dom';
import useTexts from '../../utils/UseTexts';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import '../../styles/theme.css';
import { useState } from 'react';
import { useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';


//borrar sistema, cambiarle el nombre

//borar sistema implica eliminar todos sus datos
//cambiar secreto
//

export default function SettingsAccordion({ systemId }) {
    const navigate = useNavigate();
    const texts = useTexts();
    const [systemName, setSystemName] = useState('');

    // Estados para secreto
    const [secret, setSecret] = useState('');
    const [newSecret, setNewSecret] = useState('');
    const [showSecret, setShowSecret] = useState(false);

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        const fetchSystem = async () => {
            try {
                // 1️⃣ Obtener nombre del sistema
                const { data: systemData, error: systemError } = await supabase
                    .from('systems')
                    .select('name')
                    .eq('id', systemId)
                    .single();
                if (systemError) throw systemError;
                setSystemName(systemData.name);

                // 2️⃣ Obtener el secreto desde system_secrets
                const { data: secretData, error: secretError } = await supabase
                    .from('system_secrets')
                    .select('code')      // suponiendo que el campo se llama 'secret'
                    .eq('system', systemId)
                    .single();
                if (secretError) throw secretError;
                setSecret(secretData.code);
            } catch (err) {
                console.error(err);
                setError('Error loading system data');
            }
        };

        fetchSystem();
    }, [systemId]);



    const handleDelete = async () => {
        const confirmed = window.confirm(texts.messageDeleteSystem);

        if (confirmed) {
            try {
                const { data, error } = await supabase.functions.invoke('deleteUserSystem', {
                    body: JSON.stringify({ systemId })
                });

                if (error) throw error;

                // Redirigir a otra página después de borrar
                navigate('/systems');
            } catch (err) {
                console.error(err);
                alert('Error deleting system');
            }
        }
    };
    const handleRename = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // 1️⃣ Obtener usuario actual
            const { data: { session }, error: sessionErr } = await supabase.auth.getSession();
            if (sessionErr || !session || !session.user) throw new Error('User not authenticated');
            const userId = session.user.id;

            // 2️⃣ Validar regex
            const nameRegex = /^[A-Za-z0-9_][A-Za-z0-9_ ]{1,28}[A-Za-z0-9]$/;
            if (!nameRegex.test(systemName)) {
                setError(texts.regexNameSystem);
                setLoading(false);
                return;
            }

            // 3️⃣ Verificar si el nombre ya existe para este usuario
            const { data: existing, error: existingErr } = await supabase
                .from('systems')
                .select('id')
                .eq('admin', userId)
                .eq('name', systemName)
                .maybeSingle(); // devuelve null si no hay coincidencia

            if (existing) {
                setError('You already have a system with this name');
                setLoading(false);
                return;
            }

            // 4️⃣ Actualizar nombre
            const { data, error } = await supabase
                .from('systems')
                .update({ name: systemName })
                .eq('id', systemId);

            if (error) throw error;
            alert('System name updated');
            navigate(`/system/${systemId}`);
        } catch (err) {
            console.error(err);
            setError(err.message || 'Error updating name');
            setSystemName('');

        } finally {
            setLoading(false);
        }
    };

    const handleSecretChange = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (!window.confirm(texts.messageChangeSecret)) {
                setLoading(false);
                return;
            }
            const codeRegex = /^[A-Za-z0-9]{10,30}$/;
            if (!codeRegex.test(newSecret)) {
                setError('Secret must be 10-30 alphanumeric characters');
                setLoading(false);
                return;
            }

            // 2️⃣ Obtener usuario actual
            const { data: { session }, error: sessionErr } = await supabase.auth.getSession();
            if (sessionErr || !session || !session.user) throw new Error('User not authenticated');
            const userId = session.user.id;

            // 3️⃣ Verificar si otro sistema del mismo usuario ya tiene este secret
            const { data: existingSecret, error: existingErr } = await supabase
                .from('systems')
                .select('id')
                .eq('admin', userId)
                .in('id', supabase.from('system_secrets').select('system').eq('code', newSecret))
                .maybeSingle();

            if (existingSecret) {
                setError('Another system of yours already has this secret');
                setNewSecret('');
                setLoading(false);
                return;
            }

            // 4️⃣ Actualizar secret
            const { data, error } = await supabase
                .from('system_secrets')
                .update({ code: newSecret })
                .eq('system', systemId);

            if (error) throw error;

            setSecret(newSecret);
            setNewSecret('');
            alert('Secret updated');

        } catch (err) {
            console.error(err);

            setError(err.message || 'Error updating secret');
        } finally {
            setLoading(false);
        }
    };

    const toggleShowSecret = () => setShowSecret(!showSecret);
    return (
        <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <h2>{texts.systemSettings}</h2>
            </AccordionSummary>
            <AccordionDetails>
                <h3>{texts.renameSystem}</h3>

                <form onSubmit={handleRename} className='form-container'>
                    <label>
                        {texts.newName}
                    </label>
                    <input
                        type="text"
                        value={systemName}
                        onChange={(e) => setSystemName(e.target.value)}
                        required
                        placeholder={texts.newName} // placeholder más coherente
                    />
                    <button type="submit">{texts.renameSystem}</button>
                </form>
                {error && <div className="error-message" style={{ marginTop: '10px' }}>Error</div>}
                <h3>{texts.changeSecret}</h3>
                <h3>{texts.deleteSystem}</h3>

                <button onClick={handleDelete}>
                    {texts.deleteSystem}
                </button>


                <form onSubmit={handleSecretChange} className='form-container'>
                    <label>{texts.currentSecret}</label>
                    <input
                        type={showSecret ? "text" : "password"}  // cambia dinámicamente
                        value={secret}
                        readOnly
                    />
                    <button type="button" onClick={toggleShowSecret}>
                        {showSecret ? texts.hide : texts.show}
                    </button>

                    <label>{texts.newSecret}</label>
                    <input
                        type="text"
                        value={newSecret}
                        onChange={(e) => setNewSecret(e.target.value)}
                        required
                        placeholder={texts.newSecret}
                    />
                    <button type="submit">{texts.newSecret}</button>
                </form>

                {error && <div className="error-message" style={{ marginTop: '10px' }}>Error</div>}
            </AccordionDetails>
        </Accordion>
    );
}