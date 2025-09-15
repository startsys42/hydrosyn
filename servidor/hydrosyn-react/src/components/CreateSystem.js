import { useNavigate } from 'react-router-dom';
import useTexts from '../utils/UseTexts';
import '../styles/theme.css';
import { useState } from 'react';
import { supabase } from '../utils/supabaseClient';

export default function CreateSystem() {
    const navigate = useNavigate();
    const texts = useTexts();
    const [systemName, setSystemName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleCreateSystem = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Regex: solo letras, números, guiones bajos, espacios intermedios, max 30 chars
        const nameRegex = /^[A-Za-z0-9_](?:[A-Za-z0-9_ ]{1,28}[A-Za-z0-9])?$/;
        if (!nameRegex.test(systemName)) {
            setError(texts.regexNameSystem);

            setLoading(false);
            return;
        }

        try {
            // 1️⃣ Obtener usuario logueado
            //const { data: { user }, error: userErr } = await supabase.auth.getUser();
            //  if (userErr || !user) throw new Error('Usuario no autenticado');

            //  const userId = user.id;
            const { data: { session }, error: sessionErr } = await supabase.auth.getSession();
            if (sessionErr || !session || !session.user) throw new Error('Usuario no autenticado');

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
                throw new Error(texts.limitSystems);
            }

            // 4️⃣ Verificar duplicados
            const { data: nameConflict } = await supabase
                .from('systems')
                .select('id')
                .eq('admin', userId)
                .eq('name', systemName)
                .maybeSingle();

            if (nameConflict) {
                throw new Error(texts.repeatNameSystem);
            }

            // 5️⃣ Insertar nuevo sistema
            const { data: insertedSystem, error: insertErr } = await supabase
                .from('systems')
                .insert({ name: systemName, admin: userId })
                .select('id') // importante para obtener el id insertado
                .single();

            if (insertErr) throw insertErr;

            // ✅ Éxito: limpiar campo y redirigir
            setSystemName('');
            setError('');
            // ✅ Redirigir si existe ID
            if (insertedSystem?.id) {
                navigate(`/system/${insertedSystem.id}`);
            }

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

                <button type="submit" disabled={loading}>
                    {loading ? texts.verify : texts.newSystem}
                </button>
            </form>

            {error && <div className="error-message" style={{ marginTop: '10px' }}>{error}</div>}
        </div>
    );
}