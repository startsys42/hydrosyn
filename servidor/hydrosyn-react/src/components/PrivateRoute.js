import React, { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';

const PrivateRoute = ({ checkCondition, children }) => {


    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        let isMounted = true;

        const verify = async () => {
            try {
                const res = await checkCondition();
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
                } else if (data.loggedIn && !data.changeName && !data.changePass) {

                    navigate('/dashboard', {
                        state: {
                            csrfToken: data.csrf,
                            language: data.language,
                            theme: data.theme,
                            permission: data.permission,
                        },
                    });
                } else if (data.loggedIn && !data.changeName && data.changePass) {

                    navigate('/change-password', {
                        state: {
                            csrfToken: data.csrf,
                            language: data.language,
                            theme: data.theme,
                        },
                    });
                } else if (data.loggedIn && data.changeName && !data.changePass) {

                    navigate('/change-username', {
                        state: {
                            csrfToken: data.csrf,
                            language: data.language,
                            theme: data.theme,
                        },
                    });
                }
            } catch (error) {

                if (isMounted) {
                    navigate('/error', {
                        state: {
                            code: 500,
                            message: 'Error connecting.',
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

    return children;
};
export default PrivateRoute;

