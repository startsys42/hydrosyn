import { createTheme } from '@mui/material';

// --- TEMA CLARO ---
export const lightTheme = createTheme({
    palette: {
        mode: 'light',
        primary: { main: '#1976d2' }, // Tu azul
        secondary: { main: '#dc004e' },
    },
    typography: { fontFamily: 'Roboto, sans-serif' },
    components: {
        MuiOutlinedInput: {
            styleOverrides: {
                root: {
                    // 1. Borde normal (sin estar encima) -> NEGRO
                    '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'black',
                    },
                    // 2. Borde al pasar el ratón (hover) -> AZUL
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#1976d2',
                    },
                    // 3. Borde al hacer clic (focus) -> AZUL
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#1976d2',
                    },
                },
            },
        },
    },
});

// --- TEMA OSCURO ---
export const darkTheme = createTheme({
    palette: {
        mode: 'dark',
        primary: { main: '#6402c0' }, // Tu morado
        secondary: { main: '#f48fb1' },
    },
    typography: { fontFamily: 'Roboto, sans-serif' },
    components: {
        MuiOutlinedInput: {
            styleOverrides: {
                root: {
                    // 1. Borde normal -> BLANCO/GRIS CLARO (para que se vea en fondo oscuro)
                    '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgb(255, 255, 255)',
                    },
                    // 2. Borde al pasar el ratón (hover) -> MORADO
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#ffffff',
                    },
                    // 3. Borde al hacer clic (focus) -> MORADO
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#6402c0',
                    },
                },
            },
        },
    },
});