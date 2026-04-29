import { useNavigate } from 'react-router-dom';
import useTexts from '../utils/UseTexts';


import { Container, Paper, Typography, Button, Stack } from '@mui/material';

export default function UsersAdmin() {
    const navigate = useNavigate();
    const t = useTexts();

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

                }}
            >
                <Typography variant="h4" component="h1" gutterBottom align="center">
                    {t.adminManage}
                </Typography>


                <Stack spacing={3} sx={{ mt: 4, width: '100%' }}>
                    <Button
                        variant="contained"
                        fullWidth
                        size="large"
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