import '../styles/theme.css';

import { useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import useTexts from '../utils/UseTexts';

export default function CreateUserAdmin() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const texts = useTexts();

    async function createUser(email) {
        setLoading(true);
        setMessage('');
        setError('');


        try {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            if (sessionError || !session) {
                throw new Error('Not authenticated.');
            }
            const accessToken = session.access_token;
            const { data, error: functionError } = await supabase.functions.invoke('createUserAdmin', {
                body: { email: email },

                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });

            if (functionError) {
                throw new Error(functionError.message);
            }


            if (data.error) {
                throw new Error(data.error);
            }

            setMessage("messageCreateUser");
            setEmail(''); // Limpiar input
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        createUser(email);
    };

    return (
        <div className='div-main-login'>
            <h1>{texts.createUser}</h1>
            <form onSubmit={handleSubmit} className='form-container'>
                <label>
                    {texts.email}
                </label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder={texts.email}
                />

                <button type="submit" disabled={loading}>
                    {loading ? texts.creating : texts.createUser}
                </button>
            </form>
            {message && <p style={{ color: 'green' }}>{texts[message]}</p>}
            {error && <p style={{ color: 'red' }}>{texts[error]}</p>}
        </div>
    );
}
