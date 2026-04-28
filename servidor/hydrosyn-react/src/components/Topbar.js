import React from 'react';
import { useThemeMode } from '../utils/ThemeContext';
import { useLanguage } from '../utils/LanguageContext';
import useTexts from '../utils/UseTexts';

// 1. Importamos los componentes necesarios de Material UI
import { AppBar, Toolbar, Box, Button, Select, MenuItem, FormControl } from '@mui/material';

export default function Topbar() {
    const { mode, toggleTheme } = useThemeMode();
    const { language, changeLanguage } = useLanguage();
    const t = useTexts();

    return (
        // AppBar es el contenedor clásico para barras de navegación en MUI
        <AppBar position="static" color="transparent" elevation={0}>
            <Toolbar>

                {/* Este Box vacío con flexGrow empuja los botones hacia la derecha. 
                    Si prefieres que estén a la izquierda, puedes borrar esta línea */}
                <Box sx={{ flexGrow: 1 }} />

                {/* Reemplazo del botón HTML */}
                <Button
                    variant="outlined"
                    color="inherit"
                    onClick={toggleTheme}
                    sx={{ mr: 2 }} // mr = margin-right (equivale a margin-right: 16px)
                >
                    {mode === 'light' ? t.dark : t.light}
                </Button>

                {/* Reemplazo del select HTML */}
                <FormControl size="small">
                    <Select
                        value={language}
                        onChange={(e) => changeLanguage(e.target.value)}
                        variant="outlined"
                    >
                        <MenuItem value="es">Español</MenuItem>
                        <MenuItem value="en">English</MenuItem>
                    </Select>
                </FormControl>

            </Toolbar>
        </AppBar>
    );
}
/*
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
*/