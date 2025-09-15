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
import UsersAdmin from './components/UsersAdmin';
import NotificationsAdmin from './components/NotificationsAdmin';
import ChangePassword from './components/ChangePassword';
import ChangeEmail from './components/ChangeEmail';
import { useAdminStatus } from './utils/AdminContext';
import { useOwnerStatus } from './utils/OwnerContext';
import useTexts from './utils/UseTexts';
import PrivateLayout from './components/PrivateLayout';
import RecoverPassword from './components/RecoverPassword';
import ChangePasswordRecovery from './components/ChangePasswordRecovery';
import CreateUserAdmin from './components/CreateUserAdmin';
import ActivateUserAdmin from './components/ActivateUserAdmin';
import DeleteUserAdmin from './components/DeleteUserAdmin';
import CreateUserSystems from './components/CreateUserSystems';
import ActivateUserSystems from './components/ActivateUserSystems';
import DeleteUserSystems from './components/DeleteUserSystems';
import UsersSystems from './components/UsersSystems';
import NotificationsSystem from './components/NotificationsSystem';
import { useParams } from 'react-router-dom';
import { OwnerSystemProvider } from './utils/OwnerSystemContext';
import System from './components/System';
import CreateSystem from './components/CreateSystem';



function SystemRouteWrapper() {
    const { systemId } = useParams();
    return (
        <OwnerSystemProvider systemId={systemId}>
            <System />
        </OwnerSystemProvider>
    );
}


function App() {
    const { theme, toggleTheme } = useTheme();
    const { language, changeLanguage } = useLanguage();
    const [user, setUser] = useState(null);
    const { isAdmin, loading: loadingAdmin } = useAdminStatus();
    const { isOwner, loading: loadingOwner } = useOwnerStatus();
    const t = useTexts();
    const [loadingAuth, setLoadingAuth] = useState(true);

    useEffect(() => {
        // Limpia todas las clases del body para evitar conflictos
        document.body.className = '';

        // Añade la clase correspondiente al tema actual
        document.body.classList.add(theme === 'light' ? 'light-theme' : 'dark-theme');
    }, [theme]); // Se ejecuta cuando cambia 'theme'
    {/*
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
    */}

    useEffect(() => {
        const checkUser = async () => {
            setLoadingAuth(true); // Empezar la carga
            const { data, error } = await supabase.auth.getSession();
            const session = data?.session;
            if (session) {
                // Si hay una sesión, verificar el perfil del usuario
                const { data: roleData, error: roleErr } = await supabase
                    .from('roles')
                    .select('user')
                    .eq('user', session.user.id)
                    .maybeSingle();


                const { data: adminData, error: adminErr } = await supabase
                    .from('admin_users')
                    .select('user, is_active')
                    .eq('user', session.user.id)
                    .eq('is_active', true)
                    .maybeSingle();


                const { data: systemData, error: systemErr } = await supabase
                    .from('systems_users')
                    .select('user_id, is_active')
                    .eq('user_id', session.user.id)
                    .eq('is_active', true)
                    .maybeSingle();

                // Si hay un error con el perfil o el usuario está inactivo, desloguearlo
                if (!roleData && !adminData?.is_active && !systemData) {
                    await supabase.auth.signOut();
                    setUser(null);
                } else {
                    // Si todo está bien, establecer el usuario
                    setUser(session.user);
                }
            } else {
                // Si no hay sesión, el usuario es nulo
                setUser(null);
            }
            setLoadingAuth(false); // Terminar la carga
        };

        checkUser();

        // Listener para cambios de sesión
        const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
            if (_event === 'SIGNED_OUT') {
                setUser(null);
            } else if (session) {
                checkUser();
            }
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
                    <Route
                        path="/change-password-recovery"
                        element={!user ? <ChangePasswordRecovery /> : <Navigate to="/dashboard" replace />}
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
                        path="/users-admin"
                        element={
                            !user ? (
                                <Navigate to="/" replace />
                            ) : user && isAdmin ? (
                                <UsersAdmin />
                            ) : user && !loadingAdmin ? (
                                <Navigate to="/dashboard" replace />
                            ) : null
                        }
                    />
                    <Route
                        path="/create-user-admin"
                        element={
                            !user ? (
                                <Navigate to="/" replace />
                            ) : user && isAdmin ? (
                                <CreateUserAdmin />
                            ) : user && !loadingAdmin ? (
                                <Navigate to="/dashboard" replace />
                            ) : null
                        }
                    />
                    <Route
                        path="/delete-user-admin"
                        element={
                            !user ? (
                                <Navigate to="/" replace />
                            ) : user && isAdmin ? (
                                <DeleteUserAdmin />
                            ) : user && !loadingAdmin ? (
                                <Navigate to="/dashboard" replace />
                            ) : null
                        }
                    />
                    <Route
                        path="/activate-user-admin"
                        element={
                            !user ? (
                                <Navigate to="/" replace />
                            ) : user && isAdmin ? (
                                <ActivateUserAdmin />
                            ) : user && !loadingAdmin ? (
                                <Navigate to="/dashboard" replace />
                            ) : null
                        }
                    />
                    <Route
                        path="/create-system"
                        element={
                            !user ? (
                                <Navigate to="/" replace />
                            ) : user && (isAdmin || isOwner) ? (
                                <CreateSystem />
                            ) : user && !loadingAdmin && !loadingOwner ? (
                                <Navigate to="/dashboard" replace />
                            ) : null
                        }
                    />
                    <Route
                        path="/notifications-admin"
                        element={user ? <NotificationsAdmin /> : <Navigate to="/" replace />}
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

                    <Route path="/system/:systemId" element={<SystemRouteWrapper />} />
                </Route>
            </Routes>

        </div>
    );
}
export default App;



