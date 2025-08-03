import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getGpuInfo, getOS } from '../../utils/ClientInfo';

const RouteDashboard = ({ children }) => {
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

                const clientInfo = {
                    userAgent,
                    gpuInfo,
                    cpuCores,
                    deviceMemory,
                    os,
                    origin: window.location.pathname,
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
                        body: JSON.stringify(clientInfo),
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
                } else if (!data.loggedIn) {

                    navigate('/login', {
                        state: {
                            csrfToken: data.csrf,
                            language: data.language,
                            theme: data.theme,
                            permission: data.permission,
                        },
                    });
                    return;
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

export default RouteDashboard;