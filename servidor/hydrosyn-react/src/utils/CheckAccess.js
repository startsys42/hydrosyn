import { getGpuInfo, getOS } from './ClientInfolientInfo';

export async function CheckAccess() {
    try {
        const gpuInfo = getGpuInfo() || "Unknown GPU";
        const cpuCores = navigator.hardwareConcurrency || null;
        const deviceMemory = navigator.deviceMemory || null;
        const userAgent = navigator.userAgent || "Unknown User Agent";
        const os = getOS() || "Unknown OS";

        const clientInfo = {
            userAgent,
            gpuInfo,
            cpuCores,
            deviceMemory,
            os,
            origin: window.location.pathname,
        };

        const res = await fetch('/api/check-access', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(clientInfo),
        });

        const data = await res.json();

        return {
            status: res.status,
            data,
        };

    } catch (error) {
        return {
            error: true,
            message: error.message || 'Failed to gather client information',
        };
    }
}