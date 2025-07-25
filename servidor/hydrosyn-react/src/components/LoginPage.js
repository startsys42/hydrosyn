import React, { useState } from 'react';
import { texts } from './texts';
import TopBar from './TopBar'
export default function LoginPage() {

    const location = useLocation();
    const { language = 'en', theme = 'light', csrfToken = null } = location.state || {}; // valores por defecto

    // Aquí ya tienes idioma, tema y csrfToken pasados por navigate()
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);


    const handleSubmit = (e) => {
        e.preventDefault();
        // Aquí iría la lógica de submit
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
                            style={{ marginLeft: 5 }}
                        >
                            {showPassword ? texts[language].hide : texts[language].show}
                        </button>
                    </div>
                    {errors.password && (
                        <div style={{ color: 'red', fontSize: 12 }}>{errors.password}</div>
                    )}
                </label>

                <button type="submit" style={{ marginTop: 10, width: '100%' }}>
                    {texts[language].login}
                </button>
            </form>

            <button
                onClick={toggleLanguage}
                style={{ marginTop: 20, marginRight: 10 }}
            >
                {texts[language].changeLanguage}
            </button>

            <button onClick={toggleTheme} style={{ marginTop: 20 }}>
                {texts[language].changeTheme}
            </button>

            <div style={{ marginTop: 30 }}>
                <button
                    onClick={() => alert('Funcionalidad de recuperar contraseña')}
                    style={{ color: 'blue', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                >
                    {texts[language].forgotPassword}
                </button>
            </div>

        </div>
    );
}