import { useState } from 'react';
import { supabase } from '../utils/supabaseClient';

import useTexts from '../utils/UseTexts';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Paper, Box, Typography, TextField, Button, CircularProgress, Alert } from '@mui/material';

export default function ChangePassword() {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState({ text: '', type: '' });
    const [messageKey, setMessageKey] = useState('');
    const [loading, setLoading] = useState(false);
    const texts = useTexts();
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    function validarPassword(password) {

        const letters = password.match(/[a-zA-Z]/g) || [];
        const numbers = password.match(/[0-9]/g) || [];


        if (password.length < 10) return false;


        const distinctLetters = [...new Set(letters)];
        if (distinctLetters.length < 3) return false;


        const distinctNumbers = [...new Set(numbers)];
        if (distinctNumbers.length < 2) return false;

        if (!/^[a-zA-Z0-9]+$/.test(password)) return false;

        return true;
    }

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
        setMessageKey('');


        if ((newPassword.trim() !== confirmPassword.trim())) {
            setMessageKey('noEquals');
            setLoading(false);
            return;
        }
        if (!validarPassword(newPassword)) {
            setMessageKey('invalidPassword');
            setLoading(false);
            return;
        }



        try {

            const { error: updateError } = await supabase.auth.updateUser({

                password: newPassword,
            });

            if (updateError) throw updateError;


            setMessageKey('messagePassword');


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
                    minHeight: 400,
                    justifyContent: 'center'
                }}
            >
                <Typography variant="h4" component="h1" gutterBottom align="center">
                    {texts.changePassword}
                </Typography>

                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2, width: '100%' }}>

                    <TextField
                        variant="outlined"
                        fullWidth
                        margin="normal"
                        label={texts.newPassword}
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder={texts.newPassword}
                        required
                        disabled={loading}

                        inputProps={{ minLength: 10 }}
                    />

                    <TextField
                        variant="outlined"
                        fullWidth
                        margin="normal"

                        label={texts.newPassword}
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder={texts.newPassword}
                        required
                        disabled={loading}
                        inputProps={{ minLength: 10 }}
                    />

                    <Button
                        type="submit"
                        variant="contained"
                        fullWidth
                        disabled={loading}
                        sx={{ mt: 3, mb: 2 }}
                    >
                        {loading ? <CircularProgress size={24} /> : texts.changePassword}
                    </Button>


                    <Box sx={{ minHeight: 60, width: '100%' }}>

                        {messageKey === 'noEquals' && (
                            <Alert severity="error">
                                {texts[messageKey]}
                            </Alert>
                        )}


                        {messageKey === 'messagePassword' && (
                            <Alert severity="success">
                                {texts[messageKey]}
                            </Alert>
                        )}



                    </Box>

                </Box>
            </Paper>
        </Container>


        /*
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
                    minLength={10}
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
                    minLength={10}
                />


                <button
                    type="submit"
                    disabled={loading}

                >
                    {loading ? texts.changing : texts.changePassword}
                </button>


                {messageKey && (
                    <div >
                        {texts[messageKey]}
                    </div>
                )}
            </form>
        </div>
        */
    );
}