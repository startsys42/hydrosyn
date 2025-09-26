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
            await supabase.from('login_attempts').insert({
                user: userId,
                reason: reason,
            });

        } catch (error) {

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
            const { data: adminActive, error: adminActiveError } = await supabase
                .from('admin_users')
                .select('is_active')
                .eq('user', user.id)
                .maybeSingle();


            const { data: profile, error: profileError } = await supabase
                .from('systems_users')
                .select('is_active')
                .eq('user_id', user.id)
                .eq('is_active', true)
                .maybeSingle();


            const { data: roles, error: rolesError } = await supabase
                .from('roles')
                .select('user')
                .eq('user', user.id)
                .maybeSingle();

            if (!(adminActive?.is_active) && !(profile?.is_active) && !(roles?.user)) {
                await recordFailedAttempt(user.id, 'Login attempt with a deactivated user');
                await supabase.auth.signOut();
                throw new Error(t.userInactive);
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

            {error && <p style={{ color: 'red' }}>Error</p>}
            <button
                className='button-width'
                onClick={() => navigate('/recover-password')}
            >
                {t.recoverPassword}
            </button>
        </div>
    );
}