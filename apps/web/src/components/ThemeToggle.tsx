'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

export function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const saved = localStorage.getItem('apihub-theme') as 'dark' | 'light' | null;
    if (saved) {
      setTheme(saved);
      if (saved === 'light') {
        document.documentElement.classList.add('light');
      } else {
        document.documentElement.classList.remove('light');
      }
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('apihub-theme', next);

    if (next === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  };

  return (
    <button
      onClick={toggleTheme}
      aria-label="Alternar tema"
      className="p-2 rounded-lg border border-[var(--border)] bg-[var(--card)] hover:opacity-80 transition flex items-center gap-2 text-sm"
    >
      {theme === 'dark' ? (
        <>
          <Sun className="w-4 h-4 text-yellow-400" />
          <span className="hidden sm:inline">Modo Claro</span>
        </>
      ) : (
        <>
          <Moon className="w-4 h-4 text-blue-400" />
          <span className="hidden sm:inline">Modo Escuro</span>
        </>
      )}
    </button>
  );
}
