import React, { useState, useEffect } from 'react'; // Añadido useEffect
import { useLocation, useNavigate } from 'react-router-dom';

import TopBar from './TopBar'
import texts from '../i18n/locales';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { checkAccess } from '../utils/checkAccess'; // Asegúrate de que la ruta es correcta
import { getGpuInfo, getOS } from '../utils/ClientInfo'; // Asegúrate de que la ruta es correcta



export default function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const [appData, setAppData] = useState({
        language: 'en',       // Valor por defecto
        theme: 'light',       // Valor por defecto
        csrfToken: null,
        loggedIn: false,
        permissions: false
    });

    // Aquí ya tienes idioma, tema y csrfToken pasados por navigate()
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);

    const [isCheckingAccess, setIsCheckingAccess] = useState(true);

    useEffect(() => {
        async function verify() {
            const result = await checkAccess();

            if (result.error) {
                // Error llamando al check
                navigate('/error', {
                    state: { code: 0, message: result.message },
                    replace: true,
                });
                return;
            }
            const { status, data } = result;
            setAppData(prev => ({
                ...prev,
                csrfToken: result.data?.csrf || csrf_token,
                language: result.data?.language || prev.language,
                theme: result.data?.theme || prev.theme,
                loggedIn: result.data?.loggedIn || false,
                permissions: result.data?.permission || false
            }));
            if (status === 401) {
                navigate('/error', {
                    state: {
                        code: status,
                        message: 'Unauthorized. Please log in.',
                    },
                });
                return;
            } else if (status >= 500) {
                navigate('/error', {
                    state: {
                        code: status,
                        message: 'Server error. Please try again later.',
                    },
                });
                return;
            } else if (status >= 400) {
                navigate('/error', {
                    state: {
                        code: res.status,
                        message: 'Request error. Please check your data.',
                    },
                });
                return;
            }
            if (result.data?.message && result.data.message.trim() !== "") {
                navigate('/error', {
                    state: {
                        code: 401,
                        message: result.data?.message,
                    },
                });
                return;
            } else if (result.data?.loggedIn) {

                navigate('/dashboard', {

                });
                return;

            }

        }

        verifyAccess();
    }, [location.key]);



    const handleSubmit = async (e) => {
        e.preventDefault();
        // Validación inicial
        if (!username || !password) {
            navigate('/login');
            return;
        }
        const gpuInfo = getGpuInfo() || "Unknown GPU";
        const cpuCores = navigator.hardwareConcurrency || null;
        const deviceMemory = navigator.deviceMemory || null;
        const userAgent = navigator.userAgent || "Unknown User Agent";
        const os = getOS() || "Unknown OS";
        const origin = window.location.pathname;
        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Si usas csrfToken, puedes enviarlo aquí también
                    //'X-CSRF-Token': csrfToken,
                },
                credentials: 'include',
                body: JSON.stringify({
                    username,
                    password,
                    csrf_token,
                    userAgent,
                    gpuInfo,
                    cpuCores,
                    deviceMemory,
                    os,
                    origin
                }),
            });


            if (res.status === 401) {
                navigate('/error', {
                    state: {
                        code: res.status,
                        message: 'Unauthorized. Please log in.',
                    },
                    replace: true
                });
                return;
            } else if (res.status >= 500) {
                navigate('/error', {
                    state: {
                        code: res.status,
                        message: 'Server error. Please try again later.',
                    },
                    replace: true
                });
                return;
            } else if (res.status >= 400) {
                navigate('/error', {
                    state: {
                        code: res.status,
                        message: 'Request error. Please check your data.',
                    },
                    replace: true
                });
                return;
            }

            const data = await res.json();
            if (data.message && data.message.trim() === "not") {
                navigate('/login');
                return;
            } else if (data.message && data.message.trim() === "yes") {
                navigate('/code-2fa', {
                    state: {
                        from: '/login',  // Identificador de la página de origen
                        token_2fa: data["2fa"],
                        language: data.language,
                        theme: data.theme,
                    }
                });
                return;
            }
            // Por ejemplo, si login es OK:


            // Puedes guardar token y navegar a otra página
            // localStorage.setItem('token', data.token);
            // navigate('/dashboard');

        } catch (error) {
            navigate('/error', {
                state: {
                    code: error.status || 500,
                    message: error.message || 'Network error or server not reachable',
                },
                replace: true
            });
            return;
        }

    };

    return (
        <div className={`app ${theme}`} style={{ padding: 20, fontFamily: 'Arial' }}>
            <TopBar language={data.language} theme={datatheme} texts={texts} />
            <h1>{texts[language].login}</h1>
            <form onSubmit={handleSubmit} style={{ maxWidth: 300 }}>
                <input type="hidden" name="csrf_token" value={data.csrf} />
                <label>
                    {texts[data.language].username}:
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => {
                            const value = e.target.value;
                            // Solo permite letras y números (a-z, A-Z, 0-9)
                            if (/^[a-zA-Z0-9]*$/.test(value)) {
                                setUsername(value.slice(0, 20)); // Corta a 20 caracteres máximo
                            }
                        }}
                        style={{ width: '100%', marginBottom: 5 }}
                        maxLength={20} // Frena el teclado después de 20 caracteres
                    />

                </label>

                <label>
                    {texts[data.language].password}:
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{ flex: 1, marginBottom: 5 }}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            style={{ marginLeft: 5, background: 'none', border: 'none' }}
                        >
                            <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                        </button>
                    </div>
                    {errors.password && (
                        <div style={{ color: 'red', fontSize: 12 }}>{errors.password}</div>
                    )}
                </label>

                <button
                    type="submit"
                    style={{
                        marginTop: 10,
                        width: '100%',
                        backgroundColor: !username || !password ? '#cccccc' : '', // Cambia color si está desactivado
                        cursor: !username || !password ? 'not-allowed' : 'pointer' // Cambia el cursor
                    }}
                    disabled={!username || !password || !/^[a-zA-Z0-9]+$/.test(username)} // Desactiva si no hay datos válidos
                >
                    {texts[data.language].login}
                </button>
                <button
                    onClick={() => navigate('/recover-password')}

                >
                    {texts[data.language].recoverPassword}
                </button>
            </form>





        </div>
    );
}