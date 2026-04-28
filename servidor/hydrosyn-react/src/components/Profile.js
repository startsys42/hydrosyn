import { useNavigate } from 'react-router-dom';
import useTexts from '../utils/UseTexts';
//import '../styles/theme.css';

import { Container, Box, Typography, Button } from '@mui/material';

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
            <Box
                sx={{
                    mt: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 2, // espacio entre elementos (alternativa a Stack)
                }}
            >
                <Typography variant="h4" component="h1" gutterBottom>
                    {texts.profile}
                </Typography>

                <Button
                    variant="contained"
                    fullWidth
                    onClick={() => navigate('/change-password')}
                    sx={{ py: 1.2 }}
                >
                    {texts.changePassword}
                </Button>

                <Button
                    variant="contained"
                    fullWidth
                    onClick={() => navigate('/change-email')}
                    sx={{ py: 1.2 }}
                >
                    {texts.changeEmail}
                </Button>
            </Box>
        </Container>
    );
}