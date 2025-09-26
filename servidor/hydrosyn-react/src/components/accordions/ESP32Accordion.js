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
// crear, borrar, cambiar nombre
//limite 2 esp32 sin rol


//registra esp32, 
// //eliminar 
// cambiar nombre, borrar con bombas y tanuqes, borra con estadistics sine stadistcas
export default function ESP32Accordion({ systemId }) {



    const navigate = useNavigate();
    const texts = useTexts();

    // Estados para crear ESP32
    const [systemName, setSystemName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const [espList, setEspList] = useState([]); // añadido
    const [selectedEsp, setSelectedEsp] = useState(null); // añadido
    const [newName, setNewName] = useState(''); // añadido
    const [attempts, setAttempts] = useState([]); // añadido: para DataGrid
    const [columns] = useState([ // añadido: columnas DataGrid
        { field: 'name', headerName: 'Nombre', width: 200 },
        {
            field: 'actions',
            headerName: 'Acciones',
            width: 150,
            sortable: false,
            renderCell: (params) => (
                <button
                    onClick={() => handleDeleteESP32(params.row.id, params.row.name)}
                    style={{ color: 'red' }}
                >
                    Borrar
                </button>
            ),
        },
    ]);

    useEffect(() => {
        const fetchESP32 = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('esp32')
                .select('id, name')
                .eq('system', systemId);
            if (error) {
                console.error(error);
                setError('Error al cargar ESP32');
            } else {
                setEspList(data);
                setAttempts(data); // DataGrid
            }
            setLoading(false);
        };
        fetchESP32();
    }, [systemId]);
    const handleDeleteESP32 = async (id, name) => {
        if (!window.confirm(`¿Seguro que quieres borrar el ESP32 "${name}"?`)) return;

        setLoading(true);
        setError('');
        try {
            const { error } = await supabase
                .from('esp32')
                .delete()
                .eq('id', id);

            if (error) throw error;

            // Actualizar lista local y DataGrid
            setEspList(prev => prev.filter(e => e.id !== id));
            setAttempts(prev => prev.filter(e => e.id !== id));
            setMessage(`ESP32 "${name}" eliminado`);
        } catch (err) {
            console.error(err);
            setError(err.message || 'Error al borrar ESP32');
        } finally {
            setLoading(false);
        }
    };
    const handleCreateESP32 = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {

            //comprobar, nomber, limite, auth, y que tiene   password
            // Aquí va la llamada a Supabase para crear el ESP32
            // Ejemplo:
            // await supabase.from('esp32').insert({ name: systemName, system_id: systemId });

            const user = supabase.auth.user(); // Usuario autenticado


            const { data: roleData, error: roleError } = await supabase
                .from('roles')
                .select('user')
                .eq('user', user.id)
                .maybeSingle(); // <-- no hay role ni system, solo usuario

            if (roleError) throw roleError;


            const { data: adminData, error: adminError } = await supabase
                .from('admin_users')
                .select('user, is_active')
                .eq('user', user.id)
                .maybeSingle();

            if (adminError) throw adminError;

            if (!adminData.is_active) {
                // Redirigir a dashboard si no está activo
                navigate('/dashboard');
                setLoading(false);
                return;
            }

            if (!roleData) {
                // Usuario **no tiene rol**, aplicamos límite de 2 ESP32
                const { data: espCount, error: countError } = await supabase
                    .from('esp32')
                    .select('*', { count: 'exact' }) // solo necesitamos contar
                    .eq('system', systemId);          // filtrar por sistema

                if (countError) throw countError;

                if (espCount.length >= 2) {
                    setError('Ya hay 2 ESP32 en este sistema');
                    setLoading(false);
                    return;
                }
            }

            const nameRegex = /^[A-Za-z0-9_][A-Za-z0-9_ ]{1,28}[A-Za-z0-9]$/;
            if (!nameRegex.test(systemName)) {
                setError("regexNameSystem");

                setLoading(false);
                return;
            }

            const { data: nameExists, error: nameError } = await supabase
                .from('esp32')
                .select('*')
                .eq('system', systemId)
                .eq('name', systemName);

            if (nameError) throw nameError;



            // 4️⃣ Insertar el nuevo ESP32
            const { data, error: insertError } = await supabase
                .from('esp32')
                .insert({ name: systemName, system: systemId })
                .select();

            if (insertError) throw insertError;

            // Actualizar lista local y DataGrid
            setEspList(prev => [...prev, data[0]]);
            setAttempts(prev => [...prev, data[0]]);
            setMessage('ESP32 creado correctamente');
            setSystemName('');


            setMessage('ESP32 creado correctamente');
            setSystemName('');
        } catch (err) {
            console.error(err);
            setError(err.message || 'Error al crear ESP32');
        } finally {
            setLoading(false);
        }
    };
    const handleRename = async (e) => {
        e.preventDefault();
        if (!selectedEsp || !newName) return;

        setLoading(true);
        try {
            // Llamada a Supabase para renombrar
            // await supabase.from('esp32').update({ name: newName }).eq('id', selectedEsp);

            console.log('Renombrar ESP32:', selectedEsp, 'a', newName);

            // Actualizar localmente la lista
            setEspList(prev => prev.map(esp => esp.id === selectedEsp ? { ...esp, name: newName } : esp));
            setNewName('');
            setSelectedEsp(null);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <h2>{texts.esp32}</h2>
            </AccordionSummary>
            <AccordionDetails>
                {/* CREATE esp32 */}
                <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <h3>{texts.addESP32}</h3>
                    </AccordionSummary>
                    <AccordionDetails>
                        <form onSubmit={handleCreateESP32} className='form-container'>
                            <label>
                                {texts.nameESP32}
                            </label>
                            <input
                                type="text"
                                value={systemName}
                                onChange={(e) => setSystemName(e.target.value)}
                                required
                                placeholder={texts.nameESP32} // placeholder más coherente
                            />
                            <button type="submit">{texts.addESP32}</button>
                        </form>
                        {error && <div className="error-message" style={{ marginTop: '10px' }}>Error</div>}
                    </AccordionDetails>
                </Accordion>
                {/* RENAME esp32 */}
                <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <h3>{texts.renameESP32}</h3>
                    </AccordionSummary>
                    <AccordionDetails>
                        <form onSubmit={handleRename} className='form-container'>
                            <label htmlFor="select-esp32">{texts.selectESP32}</label>
                            <select
                                value={selectedEsp || ''}
                                onChange={(e) => setSelectedEsp(Number(e.target.value))}
                            >
                                <option value='' disabled>{texts.selectESP32}</option>
                                {espList.map(esp => (
                                    <option key={esp.id} value={esp.id}>{esp.name}</option>
                                ))}
                            </select>
                            <label>{texts.newName}</label>
                            <input
                                type="text"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                required
                                placeholder={texts.newName}
                            />

                            <button type="submit" disabled={loading || !selectedEsp || !newName}>
                                {loading ? texts.renaming : texts.rename}
                            </button>


                        </form>
                        {message && <p style={{ color: 'green' }}>{texts[message]}</p>}
                        {error && <p style={{ color: 'red' }}>{texts[error]}</p>}
                    </AccordionDetails>
                </Accordion>
                {/* DELETE esp32 */}
                <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <h3>{texts.removeESP32}</h3>
                    </AccordionSummary>
                    <AccordionDetails>
                        <div style={{ height: 500, width: '100%' }}>
                            <DataGrid className="datagrid"
                                rows={attempts.map((a, index) => ({ id: index, ...a }))}
                                columns={columns}
                                loading={loading}
                                pageSize={10}
                                rowsPerPageOptions={[5, 10, 20]}
                                pagination
                            />
                        </div>

                        {error && <p style={{ color: 'red' }}>{error}</p>}
                    </AccordionDetails>
                </Accordion>
            </AccordionDetails>
        </Accordion>
    );
}
