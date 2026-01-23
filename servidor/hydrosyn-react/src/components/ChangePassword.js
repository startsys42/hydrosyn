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


        // Verificar 3 letras distintas
        const letters = newPassword.replace(/[^a-zA-Z]/g, '');
        const distinctLetters = new Set(letters).size;
        const numbers = newPassword.replace(/[^0-9]/g, '');
        const distinctNumbers = new Set(numbers).size;

        if (newPassword.length < 10 || distinctLetters < 3 || distinctNumbers < 2 || !/^[A-Za-z0-9]+$/.test(newPassword)) {
            setMessageKey('passwordRegex');

            setLoading(false);
            return;
        }
        try {


            // Actualizar la contraseña del usuario
            const { data, error } = await supabase.functions.invoke('changePassword', {
                body: {
                    newPassword: newPassword
                }
            });

            if (error) {
                console.log(" Error de Edge Function:", error.status, error.message);

                // ERROR 403: No tiene permisos
                // ERROR 401: Token inválido
                // ERROR 400: Contraseña mala
                // ERROR 405: Método incorrecto
                if (error.status === 403 || error.status === 401 || error.status === 405) {

                    setTimeout(async () => {
                        await supabase.auth.signOut();
                        navigate('/');
                    }, 500);  //  segundos para leer el mensaje
                    setLoading(false);
                    return;
                }

                else if (error.status === 400) {
                    setMessageKey('passwordRegex');
                    setNewPassword('');
                    setConfirmPassword('');
                    setLoading(false);
                    return;
                }

            }

            // ÉXITO: Contraseña cambiada
            setMessageKey('messagePassword');

            // Limpiar formulario
            setNewPassword('');
            setConfirmPassword('');

            // Desloguear por seguridad (para que se loguee con nueva contraseña)
            setTimeout(async () => {
                await supabase.auth.signOut();
                navigate('/');
            }, 2000);


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