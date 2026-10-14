'use client';
import { createContext, useContext, useEffect, useState } from 'react';

const Ctx = createContext({ dark: false, toggle: () => {} });

export default function ThemeProvider({ children }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('ms.theme');
    if (saved === 'dark') {
      setDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    if (next) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('ms.theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('ms.theme', 'light');
    }
  }

  return <Ctx.Provider value={{ dark, toggle }}>{children}</Ctx.Provider>;
}

export const useTheme = () => useContext(Ctx);
