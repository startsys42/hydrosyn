import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import useTexts from '../utils/UseTexts';
import '../styles/theme.css';

export default function Login() {
    const t = useTexts();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showResetPassword, setShowResetPassword] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [resetSent, setResetSent] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // 1. Autenticación con Supabase
            const { error: authError } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (authError) throw authError;

            // 2. Verificar si el usuario está activo
            const { data: { user } } = await supabase.auth.getUser();

            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('is_active')
                .eq('id', user.id)
                .single();

            if (profileError) throw profileError;

            if (!profile?.is_active) {
                // Registrar intento de login con usuario desactivado
                await recordFailedAttempt(user.id, 'Intento de login con usuario desactivado');
                await supabase.auth.signOut();
                throw new Error('No activo.');
            }

            // 3. Redirigir al dashboard si está activo
            navigate('/dashboard');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const recordFailedAttempt = async (userId, reason) => {
        try {
            await supabase
                .from('login_attempts')
                .insert({
                    user_id: userId,
                    attempt_time: new Date().toISOString(),
                    reason: reason,
                    status: 'failed'
                });
        } catch (error) {
            console.error('Error registrando intento fallido:', error);
        }
    };



    return (
        <div className="div-main">
            <h1>{t.login}</h1>

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleLogin}>
                <label>{t.email}</label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.email}
                    required
                />
                <label>{t.password}</label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t.password}
                    required
                />
                <button type="submit" disabled={loading}>
                    {loading ? 'Verificando...' : t.login}
                </button>
            </form>

            <button
                className="forgot-password"
                onClick={() => navigate('/recover-password')}
            >
                {t.recoverPassword}
            </button>
        </div>
    );
}