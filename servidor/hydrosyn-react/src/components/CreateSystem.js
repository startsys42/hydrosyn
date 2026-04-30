import { useNavigate } from 'react-router-dom';
import useTexts from '../utils/UseTexts';

import { useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { Container, Paper, Box, Typography, TextField, Button, Alert } from '@mui/material';

export default function CreateSystem() {
    const navigate = useNavigate();
    const texts = useTexts();
    const [systemName, setSystemName] = useState('');
    const [systemCode, setSystemCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleCreateSystem = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');


        const nameRegex = /^[A-Za-z0-9][A-Za-z0-9_ ]{1,28}[A-Za-z0-9]$/;
        if (!nameRegex.test(systemName)) {
            setError("regexNameSystem");

            setLoading(false);
            return;
        }
        const codeRegex = /^[A-Za-z0-9]{10,30}$/;
        if (!codeRegex.test(systemCode)) {
            setError("regexCodeESP");

            setLoading(false);
            return;
        }

        try {


            const { data: { session }, error: sessionErr } = await supabase.auth.getSession();
            if (sessionErr || !session || !session.user) throw new Error('User not authenticated');

            const userId = session.user.id;

            const { data: roles } = await supabase
                .from('roles')
                .select('user')
                .eq('user', userId)
                .maybeSingle();

            const isInRoles = !!roles?.user;

            const { data: adminUser, error: adminError } = await supabase
                .from('admin_users')
                .select('is_active')
                .eq('user', userId)
                .maybeSingle();

            if (adminError) {
                console.error(adminError);
                navigate('/dashboard');
                return;
            }

            if (!adminUser || !adminUser.is_active) {
                navigate('/dashboard');
                return;
            }


            const { data: existingSystems } = await supabase
                .from('systems')
                .select('id')
                .eq('admin', userId);

            if (!isInRoles && existingSystems.length >= 2) {
                throw new Error("limitSystems");
            }


            const { data: nameConflict } = await supabase
                .from('systems')
                .select('id')
                .eq('admin', userId)
                .eq('name', systemName)
                .maybeSingle();

            if (nameConflict) {
                throw new Error("repeatNameSystem");
            }

            const { data: systemsOfAdmin, error: systemsErr } = await supabase
                .from('systems')
                .select('id')
                .eq('admin', userId);

            if (systemsErr) throw systemsErr;

            const systemIds = systemsOfAdmin.map(s => s.id);

            if (systemIds.length > 0) {
                const { data: secretConflict, error: secretErr } = await supabase
                    .from('system_secrets')
                    .select('id')
                    .in('system', systemIds)
                    .eq('code', systemCode)
                    .maybeSingle();

                if (secretErr) throw secretErr;

                if (secretConflict) {
                    throw new Error("repeatSecretSystem");
                }
            }


            const { data, error } = await supabase
                .rpc('insert_system_with_secret', {
                    system_name: systemName,
                    admin_id: userId,
                    secret_value: systemCode
                });

            if (error) throw error;

            setSystemName('');
            setSystemCode('');
            setError('');

            const insertedSystemId = data[0]?.system_id;
            if (insertedSystemId) navigate(`/system/${insertedSystemId}`);

        } catch (err) {
            setError(err.message || 'Error');

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
                    minHeight: 400,
                    justifyContent: 'center'
                }}
            >
                <Typography variant="h4" component="h1" gutterBottom align="center">
                    {texts.newSystem}
                </Typography>

                <Box component="form" onSubmit={handleCreateSystem} sx={{ mt: 2, width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                        variant="outlined"
                        fullWidth
                        label={texts.nameSystem}
                        value={systemName}
                        onChange={(e) => setSystemName(e.target.value)}
                        placeholder={texts.nameSystem}
                        required
                        disabled={loading}
                        inputProps={{ minLength: 3, maxLength: 30 }}
                    />

                    <TextField
                        variant="outlined"
                        fullWidth
                        label={texts.codeESP}
                        value={systemCode}
                        onChange={(e) => setSystemCode(e.target.value)}
                        placeholder={texts.codeESP}
                        required
                        disabled={loading}
                        inputProps={{ minLength: 10, maxLength: 30 }}
                    />

                    <Button
                        type="submit"
                        variant="contained"
                        fullWidth
                        disabled={loading}
                        sx={{ mt: 1 }}
                    >
                        {loading ? texts.verify : texts.newSystem}
                    </Button>

                    {error && (
                        <Alert severity="error">
                            {texts[error] || error}
                        </Alert>
                    )}
                </Box>
            </Paper>
        </Container>

        /*
        <div className='div-main-login'>
            <h1>{texts.newSystem}</h1>
            <form onSubmit={handleCreateSystem} className="form-container">
                <label>{texts.nameSystem}</label>
                <input
                    type="text"
                    value={systemName}
                    onChange={(e) => setSystemName(e.target.value)}
                    placeholder={texts.nameSystem}
                    required
                    minLength={3}
                    maxLength={30}
                />
                <label>{texts.codeESP}</label>
                <input
                    type="text"
                    value={systemCode}
                    onChange={(e) => setSystemCode(e.target.value)}
                    placeholder={texts.codeESP}
                    required
                    minLength={10}
                    maxLength={30}
                />

                <button type="submit" disabled={loading}>
                    {loading ? texts.verify : texts.newSystem}
                </button>
            </form>

            {error && <p style={{ color: 'red' }}>{texts[error]}</p>}
        </div>
        */
    );
}