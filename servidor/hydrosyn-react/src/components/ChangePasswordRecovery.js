import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useSearchParams, useNavigate } from 'react-router-dom';
import useTexts from '../utils/UseTexts';
import '../styles/theme.css';

export default function ChangePasswordRecovery() {
    const texts = useTexts();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    // Aquí capturamos el token que manda supabase en la URL
    const access_token = searchParams.get('access_token');

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        if (!access_token) {
            setError('Token inválido o expirado.');
            setLoading(false);
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Las contraseñas no coinciden.');
            setLoading(false);
            return;
        }
        // Actualizar la contraseña con el token
        const { error } = await supabase.auth.updateUser({
            password: newPassword,
        }, {
            accessToken: access_token,
        });

        if (error) {
            setError(error.message);
        } else {
            setMessage('Contraseña actualizada correctamente.');
            setTimeout(() => {
                navigate('/'); // redirige a login después de éxito
            }, 2000);
        }
        setLoading(false);
    };

    return (
        <div className='div-main'>
            <h1>{texts?.changePassword || 'Cambiar Contraseña'}</h1>
            <form onSubmit={handleChangePassword} className='form-container '>

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
                <button type="submit" disabled={loading}>
                    {loading ? 'Cambiando...' : 'Cambiar contraseña'}
                </button>
                {message && <p style={{ color: 'green' }}>{message}</p>}
                {error && <p style={{ color: 'red' }}>{error}</p>}
            </form>
        </div>
    );
}
