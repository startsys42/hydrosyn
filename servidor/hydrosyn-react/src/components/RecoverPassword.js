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
        const { data: users, error: userError } = await supabase
            .from('user_profiles_info') // <- Debes tener una **vista pública** de auth.users
            .select('user_id')
            .eq('email', email)
            .single();

        if (users) {
            const userId = users.user_id;

            // 2. Buscar perfil asociado y verificar is_active
            const { data: profile, error: profileError } = await supabase
                .from('profile')
                .select('is_active')
                .eq('user', userId)
                .single();
            if (!profile.is_active) {
                // 3. Si no está activo, registrar intento fallido
                await supabase
                    .from('login_attempts')
                    .insert({
                        user: userId,
                        created_at: new Date().toISOString(),
                        reason: 'Intento de recuperar contraseña con usuario desactivado ',
                    });
            }
        }




        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: 'http://192.168.0.228/change-password-recovery', // o el dominio real
            });

            if (error) throw error;

            setMessage('Hemos enviado un enlace de recuperación a tu correo.');
        } catch (err) {
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
                    {loading ? t.sending : t?.sendRecoveryLink}
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
