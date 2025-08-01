import React, { useState, useEffect } from 'react'; // Añadido useEffect
import { useLocation, useNavigate } from 'react-router-dom';

import TopBar from './TopBar'
import texts from '../i18n/locales';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';



function getGpuInfo() {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return "Unknown GPU";

    try {
        // Try new standard first
        const renderer = gl.getParameter(gl.RENDERER);
        if (renderer) return renderer;

        // Fallback to deprecated extension if needed
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
            const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
            const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
            if (vendor && renderer) return `${vendor} - ${renderer}`;
        }

        return "Unknown GPU";
    } catch (e) {
        return "GPU Info Unavailable";
    }
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


export default function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { language = 'en', theme = 'light', csrfToken = null } = location.state || {}; // valores por defecto

    // Aquí ya tienes idioma, tema y csrfToken pasados por navigate()
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        // Sobrescribe el state actual con uno vacío
        navigate('.', { state: {}, replace: true });
    }, []);

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
                    csrf_token: csrfToken,
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
            <TopBar language={language} theme={theme} texts={texts} />
            <h1>{texts[language].login}</h1>
            <form onSubmit={handleSubmit} style={{ maxWidth: 300 }}>
                <input type="hidden" name="csrf_token" value={csrfToken} />
                <label>
                    {texts[language].username}:
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
                    {texts[language].password}:
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
                    {texts[language].login}
                </button>
                <button
                    onClick={() => navigate('/recover-password')}

                >
                    {texts[language].recoverPassword}
                </button>
            </form>





        </div>
    );
}