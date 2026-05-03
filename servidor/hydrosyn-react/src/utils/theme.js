import { createTheme } from '@mui/material';


export const lightTheme = createTheme({
    palette: {
        mode: 'light',
        primary: { main: '#1976d2' },
        secondary: { main: '#dc004e' },
    },
    typography: { fontFamily: 'Roboto, sans-serif' },
    components: {
        MuiOutlinedInput: {
            styleOverrides: {
                root: {

                    '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'black',
                    },

                    '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#1976d2',
                    },

                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#1976d2',
                    },
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                textPrimary: {
                    color: '#555555', // Neutral dark grey for text buttons like 'Cancel/No'
                },
            },
        },
    },
});


export const darkTheme = createTheme({
    palette: {
        mode: 'dark',
        primary: { main: '#6402c0' },
        secondary: { main: '#f48fb1' },
    },
    typography: { fontFamily: 'Roboto, sans-serif' },
    components: {
        MuiOutlinedInput: {
            styleOverrides: {
                root: {

                    '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgb(255, 255, 255)',
                    },

                    '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#ffffff',
                    },

                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#6402c0',
                    },
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                textPrimary: {
                    color: '#e0e0e0', // Light grey/white for better visibility on dark backgrounds
                },
            },
        },
    },
});