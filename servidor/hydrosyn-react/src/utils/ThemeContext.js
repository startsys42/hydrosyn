import { createContext, useContext, useEffect, useState } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material';
import { CssBaseline } from '@mui/material';
import { esES, enUS } from '@mui/x-data-grid/locales';
import { lightTheme, darkTheme } from './theme';

const ThemeContext = createContext();

export const useThemeMode = () => useContext(ThemeContext);

export const ThemeProvider = ({ children, language = 'es' }) => {
    const [mode, setMode] = useState(() => {
        return localStorage.getItem('themeMode') || 'light';
    });

    useEffect(() => {
        localStorage.setItem('themeMode', mode);
    }, [mode]);

    const toggleTheme = () => {
        setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
    };

    // Base theme según modo claro/oscuro
    const baseTheme = mode === 'light' ? lightTheme : darkTheme;
    // Combina con el locale del data grid según idioma
    const theme = createTheme(baseTheme, language === 'es' ? esES : enUS);

    return (
        <ThemeContext.Provider value={{ mode, toggleTheme }}>
            <MuiThemeProvider theme={theme}><CssBaseline />{children}</MuiThemeProvider>
        </ThemeContext.Provider>
    );
};

/*
import React, { createContext, useState, useContext } from 'react';
const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState('light');

    const toggleTheme = () => {
        setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}
    */