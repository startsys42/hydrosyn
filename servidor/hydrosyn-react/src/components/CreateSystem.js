import { useNavigate } from 'react-router-dom';
import useTexts from '../utils/UseTexts';
import '../styles/theme.css';
import { useState } from 'react';
import { supabase } from '../utils/supabaseClient';

export default function CreateSystem() {
    const navigate = useNavigate();
    const texts = useTexts();
    const [systemName, setSystemName] = useState('');
    const [systemCode, setSystemCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleCreateSystem = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Regex: solo letras, números, guiones bajos, espacios intermedios, max 30 chars
        const nameRegex = /^[A-Za-z0-9_](?:[A-Za-z0-9_ ]{1,28}[A-Za-z0-9])?$/;
        if (!nameRegex.test(systemName)) {
            setError("regexNameSystem");

            setLoading(false);
            return;
        }
        const codeRegex = /^[A-Za-z0-9]{10,30}$/;
        if (!codeRegex.test(systemCode)) {
            setError("regexCodeESP");

            setLoading(false);
            return;
        }

        try {
            // 1️⃣ Obtener usuario logueado
            //const { data: { user }, error: userErr } = await supabase.auth.getUser();
            //  if (userErr || !user) throw new Error('Usuario no autenticado');

            //  const userId = user.id;
            const { data: { session }, error: sessionErr } = await supabase.auth.getSession();
            if (sessionErr || !session || !session.user) throw new Error('User not authenticated');

            const userId = session.user.id;
            // 2️⃣ Verificar roles
            const { data: roles } = await supabase
                .from('roles')
                .select('user')
                .eq('user', userId)
                .maybeSingle();

            const isInRoles = !!roles?.user;

            // 3️⃣ Contar sistemas existentes de este usuario
            const { data: existingSystems } = await supabase
                .from('systems')
                .select('id')
                .eq('admin', userId);

            if (!isInRoles && existingSystems.length >= 2) {
                throw new Error("limitSystems");
            }


            const { data: nameConflict } = await supabase
                .from('systems')
                .select('id')
                .eq('admin', userId)
                .eq('name', systemName)
                .maybeSingle();

            if (nameConflict) {
                throw new Error("repeatNameSystem");
            }

            const { data: systemsOfAdmin, error: systemsErr } = await supabase
                .from('systems')
                .select('id')
                .eq('admin', userId);

            if (systemsErr) throw systemsErr;

            const systemIds = systemsOfAdmin.map(s => s.id);

            if (systemIds.length > 0) {
                const { data: secretConflict, error: secretErr } = await supabase
                    .from('system_secrets')
                    .select('id')
                    .in('system', systemIds)
                    .eq('code', systemCode) // <-- aquí comparas con el code que pasaste en el form
                    .maybeSingle();

                if (secretErr) throw secretErr;

                if (secretConflict) {
                    throw new Error("repeatSecretSystem"); // define este texto en tu UseTexts
                }
            }

            // 5️⃣ Insertar nuevo sistema
            const { data, error } = await supabase
                .rpc('insert_system_with_secret', {
                    system_name: systemName,
                    admin_id: userId,
                    secret_value: systemCode
                });

            if (error) throw error;
            // ✅ Éxito: limpiar campo y redirigir
            setSystemName('');
            setSystemCode('');
            setError('');
            // ✅ Redirigir si existe ID
            const insertedSystemId = data[0]?.id;
            if (insertedSystemId) navigate(`/system/${insertedSystemId}`);

        } catch (err) {
            setError(err.message || 'Error');

        } finally {
            setLoading(false);
        }
    };

    return (
        <div className='div-main-login'>
            <h1>{texts.newSystem}</h1>
            <form onSubmit={handleCreateSystem} className="form-container">
                <label>{texts.nameSystem}</label>
                <input
                    type="text"
                    value={systemName}
                    onChange={(e) => setSystemName(e.target.value)}
                    placeholder={texts.nameSystem}
                    required
                    minLength={3}
                    maxLength={30}
                />
                <label>{texts.codeESP}</label>
                <input
                    type="text"
                    value={systemCode}
                    onChange={(e) => setSystemCode(e.target.value)}
                    placeholder={texts.codeESP}
                    required
                    minLength={10}
                    maxLength={30}
                />

                <button type="submit" disabled={loading}>
                    {loading ? texts.verify : texts.newSystem}
                </button>
            </form>

            {error && <p style={{ color: 'red' }}>{texts[error]}</p>}
        </div>
    );
}