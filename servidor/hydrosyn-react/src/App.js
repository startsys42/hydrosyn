import logo from './logo.svg';
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';

import ServerErrorPage from './components/ServerErrorPage';

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ChangePasswordForced from './components/ChangePasswordForced';
import ChangeUsernameForced from './components/ChangeUsernameForced';
import PrivateRoute from './components/PrivateRoute';


function getGpuInfo() {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return "Unknown GPU";

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
        const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
        const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        if (vendor && renderer) {
            return `${vendor} - ${renderer}`;
        }
    }
    return "Unknown GPU";
}

function getOS() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    if (/windows phone/i.test(userAgent)) return "Windows Phone";
    if (/windows/i.test(userAgent)) return "Windows";
    if (/android/i.test(userAgent)) return "Android";
    if (/linux/i.test(userAgent)) return "Linux";
    if (/iphone|ipad|ipod/i.test(userAgent)) return "iOS";
    if (/mac os/i.test(userAgent)) return "Mac OS";
    return "Unknown";
}



function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const checkSession = async () => {
            const gpuInfo = getGpuInfo();
            const cpuCores = navigator.hardwareConcurrency || null;
            const deviceMemory = navigator.deviceMemory || null; // GB aproximados
            const userAgent = navigator.userAgent;
            const os = getOS();
            const ipResponse = await fetch('https://api.ipify.org?format=json');
            const ipData = await ipResponse.json();
            const ip = ipData.ip || 'Unknown';
            // Nota: IP pública la pide backend o servicio externo (opcional)
            // Aquí omitimos la IP porque fetch no puede acceder a ella directamente.
            // Si quieres, pide a un servicio externo y añádelo a este objeto.

            const clientInfo = {
                ip,
                userAgent,
                gpuInfo,
                cpuCores,
                deviceMemory,
                os,
            };

            try {
                const res = await fetch('http://127.0.0.1:5617/', {
                    method: 'POST', // usamos POST para enviar datos
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include', // importante para enviar y recibir cookies
                    body: JSON.stringify(clientInfo),
                });
                if (!res.ok) {

                    // Decide which message to show based on the status code
                    if (res.status === 401) {
                        navigate('/error', {
                            state: {
                                code: res.status,
                                message: 'Unauthorized. Please log in.',
                            },
                        });
                        return;
                    } else if (res.status >= 500) {
                        navigate('/error', {
                            state: {
                                code: res.status,
                                message: 'Server error. Please try again later.',
                            },
                        });
                        return;
                    } else if (res.status >= 400) {
                        navigate('/error', {
                            state: {
                                code: res.status,
                                message: 'Request error. Please check your data.',
                            },
                        });
                        return;
                    }
                }



                const data = await res.json();
                //isLoggedIn, setIsLoggedIn, csrfToken, setCsrfToken, theme, setTheme, 
                // language, setLanguage,permission, setPermission,username, setUsername,changePass, setChangePass,
                // changeName, setChangeName
                if (data.message && data.message.trim() !== "") {
                    navigate('/error', {
                        state: {
                            code: 401,
                            message: data.message,
                        },
                    });
                } else if (data.loggedIn && !data.changeName && !data.changePass) {
                    setIsLoggedIn(true);
                    navigate('/dashboard', {
                        state: {
                            csrfToken: data.csrf,
                            language: data.language,
                            theme: data.theme,
                            permission: data.permission,
                        },
                    });
                } else if (data.loggedIn && !data.changeName && data.changePass) {
                    setIsLoggedIn(true);
                    navigate('/change-password-forced', {
                        state: {
                            csrfToken: data.csrf,
                            language: data.language,
                            theme: data.theme,
                        },
                    });
                } else if (data.loggedIn && data.changeName && !data.changePass) {
                    setIsLoggedIn(true);
                    navigate('/change-username-forced', {
                        state: {
                            csrfToken: data.csrf,
                            language: data.language,
                            theme: data.theme,
                        },
                    });
                }

            } catch (error) {

                navigate('/');
            }


        }


        checkSession();
    }, [navigate]);
    return (
        <Router>
            <Routes>
                <Route path="/" element={<LoginPage />} />
                <Route path="/dashboard" element={<Dashboard />} />

                <Route path="/error" element={<ServerErrorPage />} />
                <Route
                    path="/dashboard"
                    element={
                        <PrivateRoute isLoggedIn={isLoggedIn}>
                            <Dashboard />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/change-password-forced"
                    element={
                        <PrivateRoute isLoggedIn={isLoggedIn}>
                            <ChangePasswordForced />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/change-username-forced"
                    element={
                        <PrivateRoute isLoggedIn={isLoggedIn}>
                            <ChangeUsernameForced />
                        </PrivateRoute>
                    }
                />
            </Routes>
        </Router>
    );
}



export default App;
