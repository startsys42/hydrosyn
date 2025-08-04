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
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: 'http://localhost:5173/reset-password', // o el dominio real
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

            {message && <div className="success-message">{message}</div>}
            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleRecover} className="form-container">
                <label htmlFor="email">{t?.email || 'Correo electrónico'}</label>
                <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t?.email || 'Correo electrónico'}
                    required
                />
                <button type="submit" disabled={loading}>
                    {loading ? 'Enviando...' : t?.sendRecoveryLink || 'Enviar enlace de recuperación'}
                </button>
            </form>

            <button onClick={() => navigate('/')} className="back-button">
                {t?.backToLogin || 'Volver al login'}
            </button>
        </div>
    );
}
