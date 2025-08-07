import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import useTexts from '../utils/UseTexts'; // O usa texto hardcodeado si no usás i18n
import '../styles/theme.css';

export default function RecoverPassword() {
    const t = useTexts(); // Opcional, si tenés traducciones
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleRecover = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        if (!email) {
            setError(t?.emailRequired || 'Por favor ingresa tu correo electrónico');
            setLoading(false);
            return;
        }

        try {
            // 1. Verificar si el usuario existe y si está activo en la tabla 'profile'
            // Es más eficiente consultar solo 'profile' si contiene el email
            // y el estado 'is_active'.
            const { data: profile, error: profileError } = await supabase
                .from('user_profiles_info')
                .select('user_id, is_active')
                .eq('email', email) // Asumiendo que tu tabla 'profile' tiene la columna 'email'
                .single();

            // 2. Manejar los casos de error o usuario inactivo
            if (profileError || !profile || !profile.is_active) {
                // Si el perfil no existe, o si existe pero no está activo,
                // registramos el intento y mostramos un mensaje genérico.
                if (profile.is_active === false) {
                    console.log('Usuario recibido:', profile.user_id);
                    await supabase
                        .from('login_attempts')
                        .insert({
                            user: profile.user_id,
                            reason: 'Intento de recuperar contraseña con usuario inactivo'
                        });
                }

                // Mostrar un mensaje genérico para no dar pistas sobre la existencia del usuario
                setMessage('Si tu cuenta existe, recibirás un enlace de recuperación en tu correo.');
                setLoading(false);
                return; // Salir de la función aquí
            }

            // 3. Si el usuario existe Y está activo, procedemos a enviar el correo de recuperación
            const { error: recoveryError } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: 'http://192.168.0.228/change-password-recovery',
            });

            if (recoveryError) throw recoveryError;

            setMessage('Si tu cuenta existe, recibirás un enlace de recuperación en tu correo.');

        } catch (err) {
            console.error('Error durante la recuperación:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="div-main">
            <h1>{t?.recoverPassword || 'Recuperar contraseña'}</h1>



            <form onSubmit={handleRecover} className="form-container">
                <label htmlFor="email">{t?.email || 'Correo electrónico'}</label>
                <input

                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t?.email || 'Correo electrónico'}
                    required
                />
                <button type="submit" disabled={loading}>
                    {loading ? t.sending : t?.recoverPassword}
                </button>
            </form>
            {message && <div className="success-message" style={{ marginTop: '10px' }}>{t?.messageRecover}</div>}
            {error && <div className="error-message" style={{ marginTop: '10px' }}>Error</div>}
            <button onClick={() => navigate('/')} className="button-width">
                {t?.backToLogin || 'Volver al login'}
            </button>
        </div>
    );
}
