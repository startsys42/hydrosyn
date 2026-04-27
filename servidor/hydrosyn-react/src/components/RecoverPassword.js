import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import useTexts from '../utils/UseTexts';
import '../styles/theme.css';

export default function RecoverPassword() {
    const t = useTexts();
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleRecover = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        if (!email) {
            setError(t?.emailRequired);
            setLoading(false);
            return;
        }

        try {
            setMessage('If your account exists, you will receive a recovery link in your email.');
            const { data, error: edgeError } = await supabase.functions.invoke('recoverPassword', {
                body: {
                    email: email
                },

            });

            if (edgeError) throw edgeError;



        } catch (err) {

            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="div-main">
            <h1>{t?.recoverPassword}</h1>



            <form onSubmit={handleRecover} className="form-container">
                <label htmlFor="email">{t?.email}</label>
                <input

                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t?.email}
                    required
                />
                <div className="button-group">
                    <button type="submit" disabled={loading}>
                        {loading ? t.sending : t?.recoverPassword}
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate('/')}
                    >
                        {t?.backToLogin}
                    </button>
                </div>

            </form>
            {message && <div className="success-message" style={{ color: 'green', marginTop: '10px' }}>{t.messageRecover}</div>}
            {/* {error && <p style={{ color: 'red' }}>Error</p>} */}

        </div>
    );
}
