import { useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import '../styles/theme.css';

export default function ChangePassword() {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState({ text: '', type: '' });
    const [loading, setLoading] = useState(false);

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

        if (newPassword.length < 6) {
            setMessage({ text: 'La contraseña debe tener al menos 6 caracteres', type: 'error' });
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
        <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-6 text-center">Cambiar Contraseña</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="currentPassword" className="block mb-1 font-medium">
                        Contraseña actual:
                    </label>
                    <input
                        id="currentPassword"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full px-3 py-2 border rounded-md"
                        required
                    />
                </div>

                <div>
                    <label htmlFor="newPassword" className="block mb-1 font-medium">
                        Nueva contraseña:
                    </label>
                    <input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-3 py-2 border rounded-md"
                        required
                        minLength={6}
                    />
                </div>

                <div>
                    <label htmlFor="confirmPassword" className="block mb-1 font-medium">
                        Confirmar nueva contraseña:
                    </label>
                    <input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-3 py-2 border rounded-md"
                        required
                        minLength={6}
                    />
                </div>

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