import { useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import '../styles/theme.css';
import useTexts from '../utils/UseTexts';
import { useEffect } from 'react';


export default function ChangeEmail() {
    const [newEmail, setNewEmail] = useState('');
    const [confirmEmail, setConfirmEmail] = useState('');
    const [message, setMessage] = useState({ text: '', type: '' });
    const [messageKey, setMessageKey] = useState('');
    const [loading, setLoading] = useState(false);
    const texts = useTexts();
    const [user, setUser] = useState(null);


    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessageKey('');


        // 1. Validar que los correos coincidan
        if (newEmail.trim() !== confirmEmail.trim()) {
            setMessageKey('noEquals');
            setLoading(false);
            return;
        }



        try {
            // 3. Llamada a la Edge Function
            // 'change-email' es el nombre que le diste al desplegarla
            const { data, error: functionError } = await supabase.functions.invoke('changeEmail', {
                body: {
                    new_email: newEmail,

                },
            });

            // Manejo de errores de la función
            if (functionError) {
                const errResponse = await functionError.context.json();
                throw new Error(errResponse.error);
            }

            // 4. Éxito: El correo de confirmación ha sido enviado por Resend
            setMessageKey('messageEmail');

            // Limpiar campos
            setNewEmail('');
            setConfirmEmail('');


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
            <h1>{texts.changeEmail}</h1>
            <form onSubmit={handleSubmit} className="form-container">

                <label htmlFor="newEmail" >
                    {texts.newEmail}:
                </label>
                <input

                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder={texts.newEmail}
                    required
                />

                <label htmlFor="confirmEmail" >
                    {texts.newEmail}:
                </label>
                <input

                    type="email"
                    value={confirmEmail}
                    onChange={(e) => setConfirmEmail(e.target.value)}
                    placeholder={texts.newEmail}
                    required

                />







                <button
                    type="submit"
                    disabled={loading}

                >
                    {loading ? texts.changing : texts.changeEmail}
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