

import { useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import useTexts from '../utils/UseTexts';
import { Container, Paper, Box, Typography, TextField, Button, Stack, CircularProgress, Alert } from '@mui/material';

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
            setEmail('');
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
        <Container maxWidth="sm">
            <Paper
                elevation={3}
                sx={{
                    mt: 8,
                    p: 4,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    width: '100%',
                    minHeight: 400

                }}
            >
                <Typography variant="h4" component="h1" gutterBottom align="center">
                    {texts.createAdmin}
                </Typography>

                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2, width: '100%' }}>

                    <TextField
                        variant="outlined"
                        fullWidth
                        margin="normal"
                        label={texts.email}
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={texts.email}
                        required
                        disabled={loading}
                    />

                    <Button
                        type="submit"
                        variant="contained"
                        fullWidth
                        disabled={loading || !email}
                        sx={{ mt: 3, mb: 2 }}
                    >
                        {loading ? <CircularProgress size={24} /> : texts.createAdmin}
                    </Button>

                    <Box sx={{ minHeight: 60, width: '100%' }}>


                        {error && (
                            <Alert severity="error">
                                {texts[error]}
                            </Alert>
                        )}


                        {message && (
                            <Alert severity="success">
                                {texts[message]}
                            </Alert>
                        )}

                    </Box>

                </Box>
            </Paper>
        </Container>
        /*
        <div className='div-main-login'>
            <h1>{texts.createAdmin}</h1>
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
                    {loading ? texts.creating : texts.createAdmin}
                </button>
            </form>
            {message && <p style={{ color: 'green' }}>{texts[message]}</p>}
            {error && <p style={{ color: 'red' }}>{texts[error]}</p>}
        </div>
        */
    );

}
