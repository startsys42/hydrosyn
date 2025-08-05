import { useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import '../styles/theme.css';
import useTexts from '../utils/UseTexts';

export default function ChangePassword() {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState({ text: '', type: '' });
    const [loading, setLoading] = useState(false);
    const texts = useTexts();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ text: '', type: '' });

        // Validaciones
        if (newPassword !== confirmPassword) {
            setMessage({ text: 'Las contraseñas no coinciden', type: 'error' });
            setLoading(false);
            return;
        }

        if (newPassword.length < 8) {
            setMessage({ text: 'La contraseña debe tener al menos 8 caracteres', type: 'error' });
            setLoading(false);
            return;
        }

        try {
            // Primero reautenticar al usuario
            const { error: authError } = await supabase.auth.signInWithPassword({
                email: supabase.auth.user()?.email || '',
                password: currentPassword,
            });

            if (authError) throw authError;

            // Luego actualizar la contraseña
            const { error: updateError } = await supabase.auth.updateUser({
                password: newPassword,
            });

            if (updateError) throw updateError;

            setMessage({
                text: '¡Contraseña cambiada con éxito!',
                type: 'success',
            });

            // Limpiar formulario
            setCurrentPassword('');
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
            <h1>{texts.changeEmail}</h1>
            <form onSubmit={handleSubmit} className="form-container">

                <label htmlFor="currentPassword" >
                    {texts.actualPassword}:
                </label>
                <input

                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder={texts.actualPassword}
                    required
                />

                <label htmlFor="newPassword" >
                    {texts.newPassword}:
                </label>
                <input

                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={texts.newPassword}
                    required
                    minLength={8}
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
                    minLength={8}
                />


                <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-2 px-4 rounded-md text-white font-medium ${loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                >
                    {loading ? 'Cambiando contraseña...' : 'Cambiar Contraseña'}
                </button>

                {message.text && (
                    <div
                        className={`p-3 rounded-md ${message.type === 'success'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                            }`}
                    >
                        {message.text}
                    </div>
                )}
            </form>
        </div>
    );
}