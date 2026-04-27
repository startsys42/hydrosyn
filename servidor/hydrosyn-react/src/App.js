import logo from './logo.svg';
import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
import ActivateDeleteUserAdmin from './components/ActivateDeleteUserAdmin';








import { useParams } from 'react-router-dom';
import { OwnerSystemProvider } from './utils/OwnerSystemContext';
import System from './components/System';
import CreateSystem from './components/CreateSystem';
import { RoleSystemProvider } from './utils/RoleSystemContext';
import { SystemRouteWrapper } from "./utils/SystemRouteWrapper";




function App() {
    const { theme, toggleTheme } = useTheme();
    const { language, changeLanguage } = useLanguage();
    const [user, setUser] = useState(null);
    const { isAdmin, loading: loadingAdmin } = useAdminStatus();
    const { isOwner, loading: loadingOwner } = useOwnerStatus();
    const t = useTexts();
    const [loadingAuth, setLoadingAuth] = useState(true);
    const [isMember, setIsMember] = useState(false);

    const location = useLocation();

    useEffect(() => {
        // Rutas públicas donde quieres la imagen
        const publicRoutes = ['/', '/recover-password'];
        const isPublicRoute = publicRoutes.includes(location.pathname);

        // Mostrar imagen SOLO si es ruta pública Y no hay usuario
        const showBg = isPublicRoute && !user;

        if (showBg) {
            document.body.classList.add('has-bg');
            document.body.classList.remove('no-bg');
        } else {
            document.body.classList.remove('has-bg');
            document.body.classList.add('no-bg');
        }

        return () => {
            document.body.classList.remove('has-bg', 'no-bg');
        };
    }, [location, user]);

    useEffect(() => {
        const checkMembership = async () => {
            if (!user) return setIsMember(false);

            const { data, error } = await supabase
                .from('systems_users')
                .select('*')
                .eq('user_id', user.id)
                .eq('is_active', true)
                .limit(1)
                .maybeSingle();

            setIsMember(!!data);
        }

        checkMembership();
    }, [user]);

    useEffect(() => {

        document.body.className = '';


        document.body.classList.add(theme === 'light' ? 'light-theme' : 'dark-theme');
    }, [theme]);
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
            setLoadingAuth(true);
            const { data, error } = await supabase.auth.getSession();
            const session = data?.session;
            if (session) {

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


                if (!roleData && !adminData?.is_active && !systemData) {
                    await supabase.auth.signOut();
                    setUser(null);
                } else {

                    setUser(session.user);
                }
            } else {

                setUser(null);
            }
            setLoadingAuth(false);
        };

        checkUser();


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
                        path="/activate-delete-user-admin"
                        element={
                            !user ? (
                                <Navigate to="/" replace />
                            ) : user && isAdmin ? (
                                <ActivateDeleteUserAdmin />
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
                            ) : user && isOwner ? (
                                <CreateSystem />
                            ) : user && !loadingOwner ? (
                                <Navigate to="/dashboard" replace />
                            ) : null
                        }
                    />
                    <Route
                        path="/notifications-admin"
                        element={

                            !user ? (
                                <Navigate to="/" replace />
                            ) : user && isAdmin ? (
                                <NotificationsAdmin />
                            ) : user && !loadingAdmin ? (
                                <Navigate to="/dashboard" replace />
                            ) : null
                        }
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

                    <Route
                        path="/system/:systemId"
                        element={
                            <SystemRouteWrapper>
                                <System />
                            </SystemRouteWrapper>
                        }
                    />
                </Route>
            </Routes>

        </div>
    );
}
export default App;



