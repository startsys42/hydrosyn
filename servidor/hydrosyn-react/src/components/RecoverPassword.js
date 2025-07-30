import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import TopBar from './TopBar';
import texts from '../i18n/locales';

export default function RecoverPassword() {
    const location = useLocation();
    const navigate = useNavigate();

    const { language = 'en', theme = 'light' } = location.state || {};
    const t = texts[language];

    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [errors, setErrors] = useState({});

    const handleSubmit = (e) => {
        e.preventDefault();

        const newErrors = {};
        if (!email.includes('@')) newErrors.email = t.invalidEmail;
        if (!username.trim()) newErrors.username = t.required;

        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) return;

        // Aquí va tu lógica real de recuperación de contraseña
        alert(`${t.recoverySent} → ${email}`);
    };

    return (
        <div className={`app ${theme}`} style={{ padding: 20, fontFamily: 'Arial' }}>
            <TopBar language={language} theme={theme} texts={texts} />
            <h1>{t.recoverTitle}</h1>

            <form onSubmit={handleSubmit} style={{ maxWidth: 300 }}>
                <label>
                    {t.email}:
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={{ width: '100%', marginBottom: 5 }}
                    />
                    {errors.email && (
                        <div style={{ color: 'red', fontSize: 12 }}>{errors.email}</div>
                    )}
                </label>

                <label>
                    {t.username}:
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

                <button type="submit" style={{ marginTop: 10, width: '100%' }}>
                    {t.recoverPassword}
                </button>

                <button
                    type="button"
                    onClick={() => navigate('/login')}
                    style={{
                        marginTop: 10,
                        color: 'blue',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        textDecoration: 'underline'
                    }}
                >
                    {t.backToLogin}
                </button>
            </form>
        </div>
    );
}