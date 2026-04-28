import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { ThemeProvider } from './utils/ThemeContext'; // Tu ThemeProvider unificado
import { LanguageProvider, useLanguage } from './utils/LanguageContext';
import { AdminProvider } from './utils/AdminContext';
import { BrowserRouter as Router } from 'react-router-dom';
import { OwnerProvider } from './utils/OwnerContext';
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

// Componente que conecta el idioma con el tema
function ThemedApp() {
    const { language } = useLanguage();
    // Opcional: configurar textos del DatePicker según idioma
    const datePickerLocaleText = {
        cancelButtonLabel: language === 'es' ? 'Cancelar' : 'Cancel',
        okButtonLabel: language === 'es' ? 'Aceptar' : 'OK',
    };
    return (
        <ThemeProvider language={language}>
            <LocalizationProvider
                dateAdapter={AdapterDayjs}
                localeText={datePickerLocaleText}
            >
                <App />
            </LocalizationProvider>
        </ThemeProvider>
    );
}


/*import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
//import { ThemeProvider } from './utils/ThemeContext';
import { LanguageProvider, useLanguage } from './utils/LanguageContext';
import { AdminProvider } from './utils/AdminContext';
import { BrowserRouter as Router } from 'react-router-dom';
import { OwnerProvider } from './utils/OwnerContext';
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";





import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import { esES } from '@mui/x-data-grid/locales';
import { enUS } from '@mui/x-data-grid/locales';



function AppWithMuiTheme() {
    const { language } = useLanguage();


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

                localeText={datePickerLocaleText}
            >
                <App />
            </LocalizationProvider>
        </MuiThemeProvider>
    );
}
*/

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
    <React.StrictMode>
        <LanguageProvider>
            <Router>
                <AdminProvider>
                    <OwnerProvider>
                        <ThemedApp />
                    </OwnerProvider>
                </AdminProvider>
            </Router>
        </LanguageProvider>
    </React.StrictMode>
);

{/*
    
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
/*
</OwnerProvider>
</AdminProvider>

</Router>

</LanguageProvider>
</ThemeProvider>
</React.StrictMode>
);
*/

reportWebVitals();
