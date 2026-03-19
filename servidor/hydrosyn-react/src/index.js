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

// 🔥 Componente que usa el idioma para MUI
function AppWithMuiTheme() {
    const { language } = useLanguage();

    // 👇 useMemo hace que se re-calcule CADA VEZ que language cambie
    const muiTheme = React.useMemo(
        () => createTheme({}, language === 'es' ? esES : enUS),
        [language] // ← ESTA ES LA CLAVE - depende de language
    );

    console.log('Tema MUI actualizado:', language); // Para ver cuándo cambia

    return (
        <MuiThemeProvider theme={muiTheme}>
            <App />
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
                            <AppWithMuiTheme />  {/* 🔥 ESTE ENVUELVE App con MUI */}
                            {/*<App />*/}
                        </OwnerProvider>
                    </AdminProvider>

                </Router>

            </LanguageProvider>
        </ThemeProvider>
    </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
