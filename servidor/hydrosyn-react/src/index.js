import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { ThemeProvider } from './utils/ThemeContext';
import { LanguageProvider, useLanguage } from './utils/LanguageContext';
import { AdminProvider } from './utils/AdminContext';
import { BrowserRouter as Router } from 'react-router-dom';
import { OwnerProvider } from './utils/OwnerContext';


import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import { esES } from '@mui/x-data-grid/locales';
import { enUS } from '@mui/x-data-grid/locales';

//  Componente que usa el idioma para MUI
function AppWithMuiTheme() {
    const { language } = useLanguage();

    //  useMemo hace que se re-calcule CADA VEZ que language cambie
    const muiTheme = React.useMemo(
        () => createTheme({}, language === 'es' ? esES : enUS),
        [language]
    );


    const datePickerLocaleText = {
        cancelButtonLabel: language === 'es' ? 'Cancelar' : 'Cancel',
        okButtonLabel: language === 'es' ? 'Aceptar' : 'OK',
    };
    return (
        <MuiThemeProvider theme={muiTheme}>
            <LocalizationProvider
                dateAdapter={AdapterDayjs}
                adapterLocale={language}
                localeText={datePickerLocaleText}
            >
                <App />
            </LocalizationProvider>
        </MuiThemeProvider>
    );
}


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <ThemeProvider>
            <LanguageProvider>
                <Router>
                    <AdminProvider>
                        <OwnerProvider>
                            <AppWithMuiTheme />
                            {/*<App />*/}
                        </OwnerProvider>
                    </AdminProvider>

                </Router>

            </LanguageProvider>
        </ThemeProvider>
    </React.StrictMode>
);


reportWebVitals();
