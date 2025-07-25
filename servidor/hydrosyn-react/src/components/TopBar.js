import React from 'react';

export default function TopBar({ language, theme, texts }) {
    const handleChangeSetting = async (type, value) => {
        try {
            await fetch('https://127.0.0.1/change-language-theme', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include', // si usas cookies
                body: JSON.stringify({
                    type, // "idioma" o "tema"
                    value, // "es", "en", "claro", "oscuro"
                }),
            });
            window.location.reload();
        } catch (error) {

        }

    };


    return (
        <div style={{ display: 'flex', gap: '1rem', padding: '0.5rem' }}>
            <div>
                <label>{texts[language].language}: </label>
                <select
                    value={language}
                    onChange={(e) => handleChangeSetting('language', e.target.value)}
                >
                    <option value="es">Español</option>
                    <option value="en">English</option>
                </select>
            </div>
            <div>
                <label>{texts[language].theme}: </label>
                <select
                    value={theme}
                    onChange={(e) => handleChangeSetting('theme', e.target.value)}
                >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                </select>
            </div>
        </div>
    );
}