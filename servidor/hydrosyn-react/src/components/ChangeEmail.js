import { useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import '../styles/theme.css';
import useTexts from '../utils/UseTexts';
import { useEffect } from 'react';

export default function ChangeEmail() {
    const [newEmail, setNewEmail] = useState('');
    const [confirmEmail, setConfirmEmail] = useState('');
    const [message, setMessage] = useState({ text: '', type: '' });
    const [loading, setLoading] = useState(false);
    const texts = useTexts();
    const [user, setUser] = useState(null);
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

        // Validaciones
        if ((newEmail.trim() !== confirmEmail.trim())) {
            setMessage({ text: texts.noEquals, type: 'error' });
            setLoading(false);
            return;
        }

        try {


            // Actualizar el correo electrónico del usuario
            const { error: updateError } = await supabase.auth.updateUser({
                email: newEmail,
            });

            if (updateError) throw updateError;

            setMessage({
                text: 'Ok',
                type: 'success',
            });

            // Limpiar formulario
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
                    {texts.email}:
                </label>
                <input

                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder={texts.email}
                    required
                />

                <label htmlFor="confirmEmail" >
                    {texts.email}:
                </label>
                <input

                    type="email"
                    value={confirmEmail}
                    onChange={(e) => setConfirmEmail(e.target.value)}
                    placeholder={texts.email}
                    required

                />






                <button
                    type="submit"
                    disabled={loading}

                >
                    {loading ? texts.changing : texts.changeEmail}
                </button>

                {message.text && (
                    <div >
                        {message.text}
                    </div>
                )}
            </form>
        </div>
    );
}