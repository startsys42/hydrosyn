import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import useTexts from '../utils/UseTexts';
//import '../styles/theme.css';
import { Container, Box, Typography, TextField, Button, Stack, CircularProgress, Alert } from '@mui/material';



export default function Login() {
    const t = useTexts();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showResetPassword, setShowResetPassword] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [resetSent, setResetSent] = useState(false);
    const navigate = useNavigate();



    const recordFailedAttempt = async (userId, reason) => {
        try {
            await supabase.from('login_attempts').insert({
                user: userId,
                reason: reason,
            });

        } catch (error) {

        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {

            const { error: authError } = await supabase.auth.signInWithPassword({

                email,
                password
            });



            if (authError) throw authError;

            const { data: { user } } = await supabase.auth.getUser();

            const { data: adminActive, error: adminActiveError } = await supabase
                .from('admin_users')
                .select('is_active')
                .eq('user', user.id)
                .maybeSingle();


            const { data: profile, error: profileError } = await supabase
                .from('systems_users')
                .select('is_active')
                .eq('user_id', user.id)
                .eq('is_active', true)
                .maybeSingle();


            const { data: roles, error: rolesError } = await supabase
                .from('roles')
                .select('user')
                .eq('user', user.id)
                .maybeSingle();

            if (!(adminActive?.is_active) && !(profile?.is_active) && !(roles?.user)) {
                await recordFailedAttempt(user.id, 'Login attempt with a deactivated user');
                await supabase.auth.signOut();
                throw new Error(t.userInactive);
            } else {
                navigate('/dashboard');
            }



        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };



    return (
        /*
        <div className="div-main">
            <h1>{t.login}</h1>



            <form onSubmit={handleLogin} className="form-container">
                <label>{t.email}</label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.email}
                    required
                />
                <label>{t.password}</label>

                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t.password}
                    required
                />
                <div className="button-group">
                    <button type="submit" disabled={loading}>
                        {loading ? t.verify : t.login}
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate('/recover-password')}
                    >
                        {t.recoverPassword}
                    </button>
                </div>

            </form>

            {error && <p style={{ color: 'red' }}>Error</p>}

        </div>

        */
        <Container maxWidth="sm">
            <Box
                sx={{
                    mt: 8,          // margin-top: theme.spacing(8)
                    mb: 4,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <Typography variant="h4" component="h1" gutterBottom>
                    {t.login}
                </Typography>

                <Box component="form" onSubmit={handleLogin} sx={{ mt: 2, width: '100%' }}>
                    <TextField
                        fullWidth
                        margin="normal"
                        label={t.email}
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={t.email}
                        required
                        disabled={loading}
                    />

                    <TextField
                        fullWidth
                        margin="normal"
                        label={t.password}
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={t.password}
                        required
                        disabled={loading}
                    />

                    <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={loading}
                            fullWidth
                        >
                            {loading ? <CircularProgress size={24} /> : t.login}
                        </Button>

                        <Button
                            variant="contained"
                            onClick={() => navigate('/recover-password')}
                            fullWidth
                        >
                            {t.recoverPassword}
                        </Button>
                    </Stack>

                    {error && (
                        <Alert severity="error" sx={{ mt: 2 }}>
                            {error}
                        </Alert>
                    )}
                </Box>
            </Box>
        </Container>
    );
}