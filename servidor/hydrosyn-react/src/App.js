import logo from './logo.svg';
import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { useEffect, useState } from 'react';
import { supabase } from './utils/supabaseClient';
import { useTheme } from './utils/ThemeContext';
import { useLanguage } from './utils/LanguageContext';
import PublicLayout from './components/PublicLayout';
import Profile from './components/Profile';
import Users from './components/Users';
import Notifications from './components/Notifications';
import ChangePassword from './components/ChangePassword';
import ChangeEmail from './components/ChangeEmail';
import { useAdminStatus } from './utils/AdminContext';
import useTexts from './utils/UseTexts';
import PrivateLayout from './components/PrivateLayout';
import RecoverPassword from './components/RecoverPassword';




function App() {
    const { theme, toggleTheme } = useTheme();
    const { language, changeLanguage } = useLanguage();
    const [user, setUser] = useState(null);
    const { isAdmin, loading: loadingAdmin } = useAdminStatus();
    const t = useTexts();
    useEffect(() => {
        // Limpia todas las clases del body para evitar conflictos
        document.body.className = '';

        // Añade la clase correspondiente al tema actual
        document.body.classList.add(theme === 'light' ? 'light-theme' : 'dark-theme');
    }, [theme]); // Se ejecuta cuando cambia 'theme'
    useEffect(() => {
        // Revisa si hay sesión activa
        const session = supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));

        // Listener para cambios de sesión
        const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => {
            listener.subscription.unsubscribe();
        };
    }, []);

    return (
        <div className={theme === 'light' ? 'light-theme' : 'dark-theme'}>

            {/* controles para cambiar tema e idioma */}

            <Routes>
                <Route element={<PublicLayout />}>
                    <Route
                        path="/"
                        element={!user ? <Login /> : <Navigate to="/dashboard" replace />}
                    />
                    <Route
                        path="/recover-password"
                        element={!user ? <RecoverPassword /> : <Navigate to="/dashboard" replace />}
                    />
                </Route>
                <Route element={<PrivateLayout />}>
                    <Route
                        path="/dashboard"
                        element={
                            !user ? (
                                <Navigate to="/" replace />
                            ) : <Dashboard />

                        }
                    />
                    <Route
                        path="/profile"
                        element={
                            !user ? (
                                <Navigate to="/" replace />
                            ) : <Profile />

                        }
                    />

                    <Route
                        path="/users"
                        element={
                            !user ? (
                                <Navigate to="/" replace />
                            ) : user && isAdmin ? (
                                <Users />
                            ) : user && !loadingAdmin ? (
                                <Navigate to="/dashboard" replace />
                            ) : null
                        }
                    />

                    <Route
                        path="/notifications"
                        element={user ? <Notifications /> : <Navigate to="/" replace />}
                    />
                    <Route
                        path="/change-password"
                        element={
                            !user ? (
                                <Navigate to="/" replace />
                            ) : <ChangePassword />

                        }
                    />
                    <Route
                        path="/change-email"
                        element={
                            !user ? (
                                <Navigate to="/" replace />
                            ) : <ChangeEmail />

                        }
                    />
                </Route>
            </Routes>

        </div>
    );
}
export default App;



