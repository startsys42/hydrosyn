import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useSearchParams, useNavigate } from 'react-router-dom';
import useTexts from '../utils/UseTexts';
import '../styles/theme.css';
import { useLocation } from 'react-router-dom';

export default function ChangePasswordRecovery() {
    const texts = useTexts();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();


    useEffect(() => {
        // Supabase detecta automáticamente el token en la URL y crea una sesión
        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === "PASSWORD_RECOVERY") {
                console.log("Evento de recuperación detectado, el usuario ya tiene sesión temporal.");
            }
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    const validatePassword = (password) => {
        const letters = password.replace(/[^a-zA-Z]/g, '');
        const distinctLetters = new Set(letters).size;
        const numbers = password.replace(/[^0-9]/g, '');
        const distinctNumbers = new Set(numbers).size;

        if (password.length < 10 ||
            distinctLetters < 3 ||
            distinctNumbers < 2 ||
            !/^[A-Za-z0-9]+$/.test(password)) {
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ text: '', type: '' });

        // Validaciones básicas
        if (newPassword !== confirmPassword) {
            setMessage({ text: 'noEquals', type: 'error' });
            setLoading(false);
            return;
        }

        if (!validatePassword(newPassword)) {
            setMessage({ text: 'passwordRegex', type: 'error' });
            setLoading(false);
            return;
        }

        try {
            // 2. Actualizar la contraseña
            // Como el usuario ya entró con el enlace, ya tiene una sesión activa
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (error) throw error;

            setMessage({
                text: 'messagePassword', // Asegúrate que esta clave exista en tu useTexts
                type: 'success',
            });

            // Limpiar y redirigir
            setNewPassword('');
            setConfirmPassword('');

            setTimeout(() => {
                navigate('/'); // O a la página que prefieras
            }, 3000);

        } catch (error) {
            setMessage({
                text: `Error: ${error.message}`,
                type: 'error',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="div-main-login">
            <h1>{texts.changePassword}</h1>
            <form onSubmit={handleSubmit} className="form-container">



                <label htmlFor="newPassword" >
                    {texts.newPassword}:
                </label>
                <input

                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={texts.newPassword}
                    required
                    minLength={10}
                />



                <label htmlFor="confirmPassword" >
                    {texts.newPassword}:
                </label>
                <input

                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={texts.newPassword}
                    required
                    minLength={10}
                />


                <button
                    type="submit"
                    disabled={loading}

                >
                    {loading ? texts.changing : texts.changePassword}
                </button>


                {message && (
                    <div >
                        {texts[message]}
                    </div>
                )}
            </form>
        </div>
    );
}