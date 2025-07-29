import React, { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import checkAccess from '../utils/checks';

const PrivateRoute = ({ checkCondition, children }) => {
    const [isVerified, setIsVerified] = useState(false);

    const location = useLocation();
    const navigate = useNavigate();


    useEffect(() => {
        let isMounted = true;

        const verify = async () => {
            try {
                const res = await checkCondition();
                console.log("Response:", {
                    status: res.status,
                    ok: res.ok,
                    headers: [...res.headers.entries()],
                    body: await res.clone().json().catch(() => "No body")
                });
                if (!isMounted) return;
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
                    }
                    else {
                        navigate('/dashboard', {
                            state: {
                                csrfToken: data.csrf,
                                language: data.language,
                                theme: data.theme,
                                permission: data.permission,
                            }
                        });
                        return;
                    }
                }
                if (isMounted) {
                    setIsVerified(true);
                }
            } catch (error) {

                if (isMounted) {
                    navigate('/error', {
                        state: {
                            code: 506,
                            message: String(error),
                        },
                    });
                }
            }
        };

        verify();

        return () => {
            isMounted = false;
        };
    }, [checkCondition, location.pathname, navigate]);

    return isVerified ? children : null;
};
export default PrivateRoute;

