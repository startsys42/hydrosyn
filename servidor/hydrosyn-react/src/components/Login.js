import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';

export default function Login() {
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
                throw new Error('Tu cuenta no está activa. Contacta al administrador.');
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

    const handlePasswordReset = async (e) => {
        e.preventDefault();
        if (!resetEmail) {
            setError('Por favor ingresa tu correo electrónico');
            return;
        }

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
                redirectTo: 'http://192.168.0.227/reset-password',
            });

            if (error) throw error;

            setResetSent(true);
            setError('');
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="login-container">
            <h2>Iniciar sesión</h2>
            {error && <div className="error-message">{error}</div>}

            {!showResetPassword ? (
                <>
                    <form onSubmit={handleLogin}>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Correo electrónico"
                            required
                        />
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Contraseña"
                            required
                        />
                        <button type="submit" disabled={loading}>
                            {loading ? 'Verificando...' : 'Iniciar sesión'}
                        </button>
                    </form>

                    <button
                        className="forgot-password"
                        onClick={() => setShowResetPassword(true)}
                    >
                        ¿Olvidaste tu contraseña?
                    </button>
                </>
            ) : (
                <div className="reset-password-form">
                    {resetSent ? (
                        <div className="success-message">
                            <p>Hemos enviado un enlace para restablecer tu contraseña a {resetEmail}</p>
                            <button onClick={() => {
                                setShowResetPassword(false);
                                setResetSent(false);
                            }}>
                                Volver al login
                            </button>
                        </div>
                    ) : (
                        <>
                            <h3>Recuperar contraseña</h3>
                            <p>Ingresa tu correo electrónico para recibir un enlace de recuperación</p>
                            <form onSubmit={handlePasswordReset}>
                                <input
                                    type="email"
                                    value={resetEmail}
                                    onChange={(e) => setResetEmail(e.target.value)}
                                    placeholder="Correo electrónico"
                                    required
                                />
                                <button type="submit">
                                    Enviar enlace de recuperación
                                </button>
                            </form>
                            <button
                                className="back-to-login"
                                onClick={() => setShowResetPassword(false)}
                            >
                                Volver al login
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}