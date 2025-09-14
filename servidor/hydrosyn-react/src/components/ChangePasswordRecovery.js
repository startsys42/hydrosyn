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


    // Aquí capturamos el token que manda supabase en la URL
    const access_token = searchParams.get('access_token');
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        if (!access_token) {
            setError('Token inválido o expirado.');
            setLoading(false);
            return;
        }
        // Validaciones
        if ((newPassword.trim() !== confirmPassword.trim())) {
            setMessage({ text: texts.noEquals, type: 'error' });
            setLoading(false);
            return;
        }

        try {

            const { error: updateError } = await supabase.auth.updateUser(
                { password: newPassword },
                { accessToken: access_token }
            );

            if (updateError) throw updateError;

            setMessage({
                text: texts.messagePassword,
                type: 'success',
            });

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

                >
                    {loading ? texts.changing : texts.changePassword}
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