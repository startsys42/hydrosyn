import '../styles/theme.css';

import { useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import useTexts from '../utils/UseTexts';

export default function CrearUsuarioForm() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [mensaje, setMensaje] = useState('');
    const [error, setError] = useState('');
    const texts = useTexts();

    async function crearUsuario(email) {
        setLoading(true);
        setMensaje('');
        setError('');


        try {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            if (sessionError || !session) {
                throw new Error('No se encontró una sesión de administrador activa.');
            }
            const accessToken = session.access_token;
            const { data, error: functionError } = await supabase.functions.invoke('createUser', {
                body: { email: email },
                // Añadir el token de autenticación en los headers
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });

            if (functionError) {
                throw new Error(functionError.message);
            }

            // Manejamos errores desde el cuerpo de la respuesta, si los hay
            if (data.error) {
                throw new Error(data.error);
            }

            setMensaje('Usuario creado y correo enviado.');
            setEmail(''); // Limpiar input
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        crearUsuario(email);
    };

    return (
        <div className='div-main-login'>
            <h1>{texts.createUser}</h1>
            <form onSubmit={handleSubmit} className='form-container'>
                <label>
                    {texts.email}
                </label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder={texts.email}
                />

                <button type="submit" disabled={loading}>
                    {loading ? texts.creating : texts.createUser}
                </button>
            </form>
            {mensaje && <p style={{ color: 'green' }}>{mensaje}</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
    );
}
