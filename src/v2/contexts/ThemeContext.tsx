import React, { createContext, useEffect, useState, useMemo } from 'react';
import { Theme, shouldUseDarkTheme, setRootTheme } from '../utils/theme';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('theme') as Theme) || 'system';
  });

  const [isDark, setIsDark] = useState(() => shouldUseDarkTheme(theme));

  useEffect(() => {
    const updateTheme = () => {
      const shouldBeDark = shouldUseDarkTheme(theme);
      setRootTheme(shouldBeDark);
      setIsDark(shouldBeDark);
      localStorage.setItem('theme', theme);
    };

    updateTheme();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', updateTheme);
    return () => mediaQuery.removeEventListener('change', updateTheme);
  }, [theme]);

  const contextValue = useMemo(() => ({
    theme,
    setTheme,
    isDark,
  }), [theme, isDark]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}