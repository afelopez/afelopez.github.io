'use client';
import { useState } from 'react';
import { useTheme, THEMES, type Theme } from '@/context/ThemeContext';

const THEME_CONFIG: Record<Theme, { label: string; color: string }> = {
  sunset:   { label: 'Sunset',   color: '#f97316' },
  ocean:    { label: 'Ocean',    color: '#3b82f6' },
  forest:   { label: 'Forest',   color: '#10b981' },
  midnight: { label: 'Midnight', color: '#4c1d95' },
  mono:     { label: 'Mono',     color: '#6b7280' },
};

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  const pickRandom = () => {
    const others = THEMES.filter((t) => t !== theme);
    setTheme(others[Math.floor(Math.random() * others.length)]);
    setOpen(false);
  };

  return (
    <div className="relative ml-3">
      <button
        onClick={() => setOpen((o) => !o)}
        title={`Theme: ${THEME_CONFIG[theme].label} — click to change`}
        className="h-7 w-7 rounded-full border-2 border-white/60 shadow-md transition-transform hover:scale-110 dark:border-gray-600/60"
        style={{ backgroundColor: THEME_CONFIG[theme].color }}
      />

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="glass absolute right-0 top-9 z-50 flex items-center gap-2 rounded-2xl p-2">
            {THEMES.map((t) => (
              <button
                key={t}
                onClick={() => { setTheme(t); setOpen(false); }}
                title={THEME_CONFIG[t].label}
                className={`h-7 w-7 rounded-full border-2 transition-transform hover:scale-110 ${
                  theme === t
                    ? 'scale-110 border-gray-800 dark:border-white'
                    : 'border-white/50 dark:border-gray-600/50'
                }`}
                style={{ backgroundColor: THEME_CONFIG[t].color }}
              />
            ))}
            <button
              onClick={pickRandom}
              title="Random theme"
              className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white/50 bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600 text-xs font-bold text-white transition-transform hover:scale-110 dark:border-gray-600/50"
            >
              ?
            </button>
          </div>
        </>
      )}
    </div>
  );
}
