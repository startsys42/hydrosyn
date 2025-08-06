import { useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import '../styles/theme.css';
import useTexts from '../utils/UseTexts';

export default function ChangeEmail() {
    const [newEmail, setNewEmail] = useState('');
    const [confirmEmail, setConfirmEmail] = useState('');
    const [message, setMessage] = useState({ text: '', type: '' });
    const [loading, setLoading] = useState(false);
    const texts = useTexts();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ text: '', type: '' });

        // Validaciones
        if (newEmail !== confirmEmail) {
            setMessage({ text: 'Los correos electrónicos no coinciden', type: 'error' });
            setLoading(false);
            return;
        }

        try {

            // Obtenemos la sesión actual para verificar el email
            const { data: { user } } = await supabase.auth.getSession();
            const currentEmail = user.email;

            // Validar que el nuevo email sea diferente al actual
            if (newEmail === currentEmail) {
                setMessage({ text: 'El nuevo correo electrónico es el mismo que el actual.', type: 'error' });
                setLoading(false);
                return;
            }

            // Actualizar el correo electrónico del usuario
            const { error: updateError } = await supabase.auth.updateUser({
                email: newEmail,
            });

            if (updateError) throw updateError;

            setMessage({
                text: '¡Correo electrónico cambiado con éxito!',
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
                    placeholder={texts.confirmEmail}
                    required
                    minLength={8}
                />






                <button
                    type="submit"
                    disabled={loading}

                >
                    {loading ? texts.changing : texts.changeEmail}
                </button>

                {message.text && (
                    <div

                    >
                        {message.text}
                    </div>
                )}
            </form>
        </div>
    );
}