import React, { createContext, useContext, useEffect, useState, ReactNode, useLayoutEffect } from 'react';
import { THEMES, Theme, DEFAULT_THEME_ID } from '../constants/themes';

interface ThemeContextType {
    currentTheme: Theme;
    setTheme: (themeId: string) => void;
    availableThemes: Theme[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [activeThemeId, setActiveThemeId] = useState<string>(() => {
        // Load from storage or default
        try {
            const saved = localStorage.getItem('app_theme');
            // Validate if saved theme exists
            if (saved && THEMES.some(t => t.id === saved)) {
                return saved;
            }
        } catch (e) {}
        return DEFAULT_THEME_ID;
    });

    const currentTheme = THEMES.find(t => t.id === activeThemeId) || THEMES[0];

    const setTheme = (id: string) => {
        // PERFORMANCE FIX:
        // Temporarily disable ALL CSS transitions globally.
        // This prevents the browser from trying to animate hundreds of elements simultaneously,
        // which causes the "freeze" or unresponsiveness.
        const css = document.createElement('style');
        css.type = 'text/css';
        css.appendChild(document.createTextNode(`* { transition: none !important; }`));
        document.head.appendChild(css);

        setActiveThemeId(id);
        
        try {
            localStorage.setItem('app_theme', id);
        } catch (e) {}

        // Force a browser paint cycle, then re-enable transitions.
        // We use a small timeout to ensure the DOM has updated with the new variables 
        // before we turn animations back on.
        setTimeout(() => {
            const _ = window.getComputedStyle(document.body).opacity; // Force reflow
            document.head.removeChild(css);
        }, 50);
    };

    // Use useLayoutEffect to apply variables synchronously before paint where possible, 
    // reducing visual flash, though strict mode might still show double render.
    useLayoutEffect(() => {
        const root = document.documentElement;
        const c = currentTheme.colors;
        
        root.style.setProperty('--bg-page', c.bgPage);
        root.style.setProperty('--bg-panel', c.bgPanel);
        root.style.setProperty('--border-main', c.border);
        root.style.setProperty('--color-primary', c.primary);
        root.style.setProperty('--color-secondary', c.secondary);
        root.style.setProperty('--color-tertiary', c.tertiary);
        root.style.setProperty('--text-main', c.textMain);
        root.style.setProperty('--text-muted', c.textMuted);
        root.style.setProperty('--tag-text', c.tagText);

    }, [currentTheme]);

    return (
        <ThemeContext.Provider value={{ currentTheme, setTheme, availableThemes: THEMES }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};