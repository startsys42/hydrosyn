import { useNavigate } from 'react-router-dom';
import useTexts from '../utils/UseTexts';
//import '../styles/themeo.css';
import { Container, Paper, Box, Typography, Button, Stack } from '@mui/material';

export default function Profile() {
    const navigate = useNavigate();
    const texts = useTexts();

    return (
        /*
        <div className='div-main-login'>
            <h1>{texts.profile}</h1>

            <button className='button-full' onClick={() => navigate('/change-password')}>
                {texts.changePassword}
            </button>

            <button className='button-full' onClick={() => navigate('/change-email')} >
                {texts.changeEmail}
            </button>
        </div>
        */
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
                    {texts.profile}
                </Typography>


                <Stack spacing={3} sx={{ mt: 4, width: '100%' }}>
                    <Button
                        variant="contained"
                        fullWidth
                        size="large"
                        onClick={() => navigate('/change-password')}
                    >
                        {texts.changePassword}
                    </Button>

                    <Button
                        variant="contained"
                        fullWidth
                        size="large"
                        onClick={() => navigate('/change-email')}
                    >
                        {texts.changeEmail}
                    </Button>
                </Stack>

            </Paper>
        </Container>
    );
}