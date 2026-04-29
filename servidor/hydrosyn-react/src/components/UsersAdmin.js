import { useNavigate } from 'react-router-dom';
import useTexts from '../utils/UseTexts';

// 1. Importamos los componentes de Material UI
import { Container, Paper, Typography, Button, Stack } from '@mui/material';

export default function UsersAdmin() {
    const navigate = useNavigate();
    const t = useTexts();

    return (
        <Container maxWidth="sm">
            <Paper
                elevation={3} // El mismo nivel de sombra que en las demás pantallas
                sx={{
                    mt: 8,
                    p: 4,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',

                    minHeight: 400, // Mantenemos la misma altura para que no de saltos raros al navegar
                    justifyContent: 'center'
                }}
            >
                <Typography variant="h4" component="h1" gutterBottom align="center">
                    {t.adminManage}
                </Typography>

                {/* Stack es perfecto para apilar elementos. 
                    spacing={3} añade exactamente 24px de separación entre cada botón automáticamente */}
                <Stack spacing={3} sx={{ mt: 4, width: '100%' }}>
                    <Button
                        variant="contained"
                        fullWidth
                        size="large" // Los hacemos un poco más grandes al ser un menú principal
                        onClick={() => navigate('/create-user-admin')}
                    >
                        {t.createAdmin}
                    </Button>

                    <Button
                        variant="contained"
                        fullWidth
                        size="large"
                        onClick={() => navigate('/activate-delete-user-admin')}
                    >
                        {t.activateDeleteAdmin}
                    </Button>
                </Stack>

            </Paper>
        </Container>
    );
}

//import '../styles/themeo.css';
/*
import { useNavigate } from 'react-router-dom';
import useTexts from '../utils/UseTexts';


export default function UsersAdmin() {
    const navigate = useNavigate();
    const t = useTexts();

    return (
        <div className='div-main-login'>
            <h1>{t.adminManage}</h1>

            <button className='button-full' onClick={() => navigate('/create-user-admin')}>
                {t.createAdmin}
            </button>

            <button className='button-full' onClick={() => navigate('/activate-delete-user-admin')} >
                {t.activateDeleteAdmin}
            </button>

        </div>
    );
}

*/