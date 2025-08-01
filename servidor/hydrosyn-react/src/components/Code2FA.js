import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import texts from '../i18n/locales';

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

function Code2FA() {
    const location = useLocation();
    const navigate = useNavigate();
    const [token2FA] = useState(location.state?.token_2fa || '');
    const [code, setCode] = useState('');
    const [language] = useState(location.state?.language || 'en');
    const [theme] = useState(location.state?.theme || 'light');
    const [error, setError] = useState('');

    // Limpiar state de navegación
    useEffect(() => {
        if (location.state?.token_2fa) {
            navigate('.', { state: {}, replace: true });
        }
    }, []);



    // 2. Limpiar el state de navegación (sin recargar)
    useEffect(() => {
        if (location.state?.token_2fa) {
            navigate('.', { state: {}, replace: true });
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Validación: 6 caracteres alfanuméricos
        if (!/^[a-zA-Z0-9]{6}$/.test(code)) {
            setCode(''); // Limpia sin mostrar error
            return;
        }


        const gpuInfo = getGpuInfo() || "Unknown GPU";
        const cpuCores = navigator.hardwareConcurrency || null;
        const deviceMemory = navigator.deviceMemory || null;
        const userAgent = navigator.userAgent || "Unknown User Agent";
        const os = getOS() || "Unknown OS";
        const origin = window.location.pathname;
        try {
            const res = await fetch('/code-2fa', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Si usas csrfToken, puedes enviarlo aquí también
                    //'X-CSRF-Token': csrfToken,
                },
                credentials: 'include',
                body: JSON.stringify({
                    token_2fa: token2FA,
                    code_2fa: code,

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
                navigate('/dashboard', {
                    state: {
                        from: '/login',  // Identificador de la página de origen
                        token_2fa: data["2fa"],
                        language: data.language,
                        theme: data.theme,

                    }
                });
                return;
            }
            else if (data.message && data.message.trim() === "same") {
                setCode('');
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
            <h1>{texts[language].fa}</h1>

            <form onSubmit={handleSubmit} style={{ maxWidth: 300 }}>
                <input
                    type="hidden"
                    name="token_2fa"
                    value={token2FA}
                />

                <label>
                    {texts[language].code2fa}
                    <input
                        type="text"
                        value={code}
                        onChange={(e) => {
                            setCode(e.target.value);
                            setError(''); // Limpiar error al escribir
                        }}
                        style={{ width: '100%', marginBottom: 10 }}
                        maxLength={6}
                        pattern="[a-zA-Z0-9]{6}"
                        title={texts[language].codeRequirements}
                        required
                    />
                </label>

                {error && (
                    <div style={{ color: 'red', marginBottom: 10 }}>
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    style={{
                        marginTop: 10,
                        width: '100%',
                        padding: 8,
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: 4
                    }}
                    disabled={!code || code.length !== 6}
                >
                    {texts[language].verify}
                </button>
            </form>
        </div>
    );
}

export default Code2FA;