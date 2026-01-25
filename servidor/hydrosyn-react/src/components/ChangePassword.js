import { useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import '../styles/theme.css';
import useTexts from '../utils/UseTexts';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ChangePassword() {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState({ text: '', type: '' });
    const [messageKey, setMessageKey] = useState('');
    const [loading, setLoading] = useState(false);
    const texts = useTexts();
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    function validarPassword(password) {
        // Extraer letras y números
        const letters = password.match(/[a-zA-Z]/g) || [];
        const numbers = password.match(/[0-9]/g) || [];

        // Longitud mínima
        if (password.length < 10) return false;

        // Letras distintas
        const distinctLetters = [...new Set(letters)];
        if (distinctLetters.length < 3) return false;

        // Números distintos
        const distinctNumbers = [...new Set(numbers)];
        if (distinctNumbers.length < 2) return false;

        // Solo letras y números
        if (!/^[a-zA-Z0-9]+$/.test(password)) return false;

        return true;
    }

    useEffect(() => {
        async function getUser() {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        }
        getUser();
    }, []);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ text: '', type: '' });
        setMessageKey('');

        // Validaciones
        if ((newPassword.trim() !== confirmPassword.trim())) {
            setMessageKey('noEquals');
            setLoading(false);
            return;
        }
        if (!validarPassword(newPassword)) {
            setMessageKey('invalidPassword'); // mensaje nuevo en texts
            setLoading(false);
            return;
        }



        try {

            const { error: updateError } = await supabase.auth.updateUser({
                // Actualizar la contraseña del usuario
                password: newPassword,
            });

            if (updateError) throw updateError;

            // ÉXITO: Contraseña cambiada
            setMessageKey('messagePassword');

            // Limpiar formulario
            setNewPassword('');
            setConfirmPassword('');



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


                {messageKey && (
                    <div >
                        {texts[messageKey]}
                    </div>
                )}
            </form>
        </div>
    );
}