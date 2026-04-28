import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import useTexts from '../utils/UseTexts';
//import '../styles/themeo.css';
import { Container, Paper, Box, Typography, TextField, Button, Stack, CircularProgress, Alert } from '@mui/material';

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
        /*
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
            {/* {error && <p style={{ color: 'red' }}>Error</p>} */
        /*}

        </div>
        */

        <Container maxWidth="sm">
            <Paper
                sx={{
                    mt: 8,
                    p: 4,
                    //  mb: 4,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    minHeight: 400,
                }}
            >
                <Typography variant="h4" component="h1" gutterBottom>
                    {t?.recoverPassword}
                </Typography>

                <Box component="form" onSubmit={handleRecover} sx={{ mt: 2, width: '100%' }}>
                    <TextField
                        id="outlined-basic"
                        variant="outlined"
                        fullWidth
                        margin="normal"
                        label={t?.email}
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={t?.email}
                        required
                        disabled={loading}
                    />

                    <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
                        <Button type="submit" variant="contained" disabled={loading} fullWidth>
                            {loading ? t.sending : t?.recoverPassword}
                        </Button>
                        <Button variant="contained" onClick={() => navigate('/')} fullWidth>
                            {t?.backToLogin}
                        </Button>
                    </Stack>
                </Box>

                {message && (
                    <div style={{ color: 'green', marginTop: '10px' }}>
                        {t.messageRecover}
                    </div>
                )}

                {/* Error sigue comentado exactamente como en el original */}
                {/* {error && <p style={{ color: 'red' }}>Error</p>} */}
            </Paper>
        </Container>
    );
}
