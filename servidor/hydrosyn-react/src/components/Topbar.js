import React from 'react';
import { useTheme } from '../utils/ThemeContext';
import { useLanguage } from '../utils/LanguageContext';
import useTexts from '../utils/UseTexts';

export default function Topbar() {
    const { theme, toggleTheme } = useTheme();
    const { language, changeLanguage } = useLanguage();
    const t = useTexts();

    return (
        <div className="topbar">
            <button onClick={toggleTheme}>
                {theme === 'light' ? t.dark : t.light}
            </button>

            <select
                value={language}
                onChange={(e) => changeLanguage(e.target.value)}
                style={{ marginLeft: 10 }}
            >
                <option value="es">Español</option>
                <option value="en">English</option>
            </select>
        </div>
    );
}