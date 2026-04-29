import React from 'react';
import { useThemeMode } from '../utils/ThemeContext';
import { useLanguage } from '../utils/LanguageContext';
import useTexts from '../utils/UseTexts';

import { AppBar, Toolbar, Box, Button, Select, MenuItem, FormControl } from '@mui/material';

export default function Topbar() {
    const { mode, toggleTheme } = useThemeMode();
    const { language, changeLanguage } = useLanguage();
    const t = useTexts();

    return (

        <AppBar position="static" color="transparent" elevation={0}>
            <Toolbar>


                <Box sx={{ flexGrow: 1 }} />


                <Button
                    variant="outlined"
                    color="inherit"
                    onClick={toggleTheme}
                    sx={{ mr: 2 }}
                >
                    {mode === 'light' ? t.dark : t.light}
                </Button>


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