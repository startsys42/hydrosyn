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
            // Obtener token del admin logueado
            const {
                data: { session },
            } = await supabase.auth.getSession();
            const tokenDelUsuarioAdmin = session?.access_token;

            if (!tokenDelUsuarioAdmin) {
                throw new Error('No hay sesión activa, por favor inicia sesión.');
            }

            const response = await fetch('https://tu-dominio.com/tu-endpoint', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer ' + tokenDelUsuarioAdmin,
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error desconocido');
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
                    {loading ? 'Creando...' : 'Crear usuario'}
                </button>
            </form>
            {mensaje && <p style={{ color: 'green' }}>{mensaje}</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
    );
}
