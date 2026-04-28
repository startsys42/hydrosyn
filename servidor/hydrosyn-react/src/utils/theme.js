import { createTheme } from '@mui/material';

// Tema claro
export const lightTheme = createTheme({
    palette: {
        mode: 'light',
        primary: { main: '#1976d2' },
        secondary: { main: '#dc004e' },
    },
    typography: { fontFamily: 'Roboto, sans-serif' },
});

// Tema oscuro
export const darkTheme = createTheme({
    palette: {
        mode: 'dark',
        primary: { main: '#90caf9' },
        secondary: { main: '#f48fb1' },
    },
    typography: { fontFamily: 'Roboto, sans-serif' },
});