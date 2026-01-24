import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { ThemeProvider } from './utils/ThemeContext';
import { LanguageProvider } from './utils/LanguageContext';
import { AdminProvider } from './utils/AdminContext';
import { BrowserRouter as Router } from 'react-router-dom';
import { OwnerProvider } from './utils/OwnerContext';



const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <ThemeProvider>
            <LanguageProvider>
                <Router>
                    <AdminProvider>
                        <OwnerProvider>
                            <App />
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
