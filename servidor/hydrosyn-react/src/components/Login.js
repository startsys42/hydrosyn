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


    const recordFailedAttempt = async (userId, reason) => {
        try {
            await supabase.rpc('insert_attempts', {
                user_id: userId,
                reason: reason,
            });
        } catch (error) {
            console.error('Error registrando intento fallido:', error);
        }
    };

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
            console.log('Usuario recibido:', user);
            const { data: profile, error: profileError } = await supabase
                .from('profile')
                .select('is_active')
                .eq('user', user.id)
                .single();

            if (profileError) throw profileError;
            console.log('Perfil recibido:', profile.is_active);
            console.log('Error del perfil:', profileError);
            if (profile.is_active === false) {
                // Registrar intento de login con usuario desactivado
                console.log('Perfil recibido no activo:', profile);
                await recordFailedAttempt(user.id, 'Intento de login con usuario desactivado');
                await supabase.auth.signOut();

                throw new Error('No activo.');
            } else {
                navigate('/dashboard');
            }

            // 3. Redirigir al dashboard si está activo

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };



    return (
        <div className="div-main">
            <h1>{t.login}</h1>



            <form onSubmit={handleLogin} className="form-container">
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
                    {loading ? t.verify : t.login}
                </button>
            </form>

            {error && <div className="error-message" style={{ marginTop: '10px' }}>Error</div>}
            <button
                className='button-width'
                onClick={() => navigate('/recover-password')}
            >
                {t.recoverPassword}
            </button>
        </div>
    );
}