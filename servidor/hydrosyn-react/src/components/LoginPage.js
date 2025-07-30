import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import TopBar from './TopBar'
import texts from '../i18n/locales';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
export default function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { language = 'en', theme = 'light', csrfToken = null } = location.state || {}; // valores por defecto

    // Aquí ya tienes idioma, tema y csrfToken pasados por navigate()
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);


    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Si usas csrfToken, puedes enviarlo aquí también
                    //'X-CSRF-Token': csrfToken,
                },
                body: JSON.stringify({
                    username,
                    password,
                    csrfToken,
                }),
            });

            if (!response.ok) {
                // Aquí manejas errores de la API
                const errorData = await response.json();
                setErrors({ general: errorData.message || 'Error en login' });
                return;
            }

            const data = await response.json();
            // Por ejemplo, si login es OK:
            console.log('Login OK, token:', data.token);

            // Puedes guardar token y navegar a otra página
            // localStorage.setItem('token', data.token);
            // navigate('/dashboard');

        } catch (error) {
            setErrors({ general: 'Error de red o inesperado' });
        }
    };

    return (
        <div className={`app ${theme}`} style={{ padding: 20, fontFamily: 'Arial' }}>
            <TopBar language={language} theme={theme} texts={texts} />
            <h1>{texts[language].login}</h1>
            <form onSubmit={handleSubmit} style={{ maxWidth: 300 }}>
                <input type="hidden" name="csrfToken" value={csrfToken} />
                <label>
                    {texts[language].username}:
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        style={{ width: '100%', marginBottom: 5 }}
                    />
                    {errors.username && (
                        <div style={{ color: 'red', fontSize: 12 }}>{errors.username}</div>
                    )}
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

                <button type="submit" style={{ marginTop: 10, width: '100%' }}>
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