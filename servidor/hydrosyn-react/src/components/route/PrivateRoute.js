import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

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

const PrivateRoute = ({ children }) => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkAccess = async () => {


            try {
                const gpuInfo = getGpuInfo() || "Unknown GPU";
                const cpuCores = navigator.hardwareConcurrency || null;
                const deviceMemory = navigator.deviceMemory || null;
                const userAgent = navigator.userAgent || "Unknown User Agent";
                const os = getOS() || "Unknown OS";
                const origin = window.location.pathname;
                const clientInfo = {
                    userAgent,
                    gpuInfo,
                    cpuCores,
                    deviceMemory,
                    os,

                };
                let res;
                let data;

                try {
                    res = await fetch('/api/check-access', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        credentials: 'include',
                        body: JSON.stringify(const gpuInfo = getGpuInfo() || "Unknown GPU";
                        const cpuCores = navigator.hardwareConcurrency || null;
                        const deviceMemory = navigator.deviceMemory || null;
                        const userAgent = navigator.userAgent || "Unknown User Agent";
                        const os = getOS() || "Unknown OS";
                        origin: window.location.pathname,
),
                    });
    data = await res.json();
} catch (err) {
    navigate('/error', {
        state: {
            code: res?.status || 0,
            message: err.message || 'Network error or server not reachable',
        },
    });
    return;
}

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

if (data.message && data.message.trim() !== "") {
    navigate('/error', {
        state: {
            code: 401,
            message: data.message,
        },
    });
    return;
} else if (data.loggedIn) {
    if (data.changeName) {
        navigate('/change-username', {
            state: {
                csrfToken: data.csrf,
                language: data.language,
                theme: data.theme,
                permission: data.permission,
            },
        });
        return;
    } else if (data.changePassword) {
        navigate('/change-password', {
            state: {
                csrfToken: data.csrf,
                language: data.language,
                theme: data.theme,
                permission: data.permission,
            },
        });
        return;
    } else {
        navigate('/dashboard', {
            state: {
                csrfToken: data.csrf,
                language: data.language,
                theme: data.theme,
                permission: data.permission,
            },
        });
        return;
    }
}
            } catch (error) {
    navigate('/error', {
        state: {
            code: 0,
            message: error.message || 'Failed to gather client information',
        },
    });
    return;
} finally {
    setIsLoading(false);
}
        };

checkAccess();
    }, [navigate]);

if (isLoading) {
    return null;
}

return children;
};

export default PrivateRoute;