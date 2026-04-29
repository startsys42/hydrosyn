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
    },
});