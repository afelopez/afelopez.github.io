'use client';
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export type Theme = 'sunset' | 'ocean' | 'forest' | 'midnight' | 'mono';
export const THEMES: Theme[] = ['sunset', 'ocean', 'forest', 'midnight', 'mono'];

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  cycleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

function applyTheme(t: Theme) {
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem('portfolio-theme', t);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('sunset');

  useEffect(() => {
    const stored = localStorage.getItem('portfolio-theme') as Theme | null;
    const initial =
      stored && THEMES.includes(stored)
        ? stored
        : THEMES[Math.floor(Math.random() * THEMES.length)];
    applyTheme(initial);
    setThemeState(initial);
  }, []);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    applyTheme(t);
  };

  const cycleTheme = () => {
    const next = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length];
    setTheme(next);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, cycleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
