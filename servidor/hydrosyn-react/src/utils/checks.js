import config from '../config';

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



export async function checkAccess() {
    try {
        const gpuInfo = getGpuInfo();
        const cpuCores = navigator.hardwareConcurrency || null;
        const deviceMemory = navigator.deviceMemory || null; // GB aproximados
        const userAgent = navigator.userAgent;
        const os = getOS();


        // Nota: IP pública la pide backend o servicio externo (opcional)
        // Aquí omitimos la IP porque fetch no puede acceder a ella directamente.
        // Si quieres, pide a un servicio externo y añádelo a este objeto.

        const clientInfo = {

            userAgent,
            gpuInfo,
            cpuCores,
            deviceMemory,
            os,
            origin: window.location.pathname,
        };

        try {
            const res = await fetch(`${config.API_URL}/check-access`, {
                method: 'POST', // usamos POST para enviar datos
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include', // importante para enviar y recibir cookies
                body: JSON.stringify(clientInfo),
            });
            const data = await res.json();
            return {
                ok: true,
                status: res.status,
                ...data,
            };

        } catch (err) {
            console.error('Error in checkAccess:', err);
            return {
                ok: false,
                status: err.response?.status || 0,
                error: err.message || 'Network error or server not reachable',
            };
        }
    } catch (error) {
        console.error('Error in checkAccess outer:', error);
        return {
            ok: false,
            status: 0,
            error: 'Failed to gather client information',
        };
    }
}