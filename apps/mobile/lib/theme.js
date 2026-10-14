import { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'market-store:theme';

const light = {
  mode: 'light',
  bg: '#f2f4f7',
  card: '#ffffff',
  text: '#111827',
  textMuted: '#6b7280',
  textDim: '#9ca3af',
  border: '#e5e7eb',
  inputBg: '#ffffff',
  inputBorder: '#e5e7eb',
  primary: '#059669',
  primaryText: '#ffffff',
  chipBg: '#ffffff',
  chipBorder: '#e5e7eb',
  chipText: '#374151',
  chipActiveBg: '#059669',
  chipActiveText: '#ffffff',
  tabBar: '#ffffff',
  tabBorder: '#e5e7eb',
  tabActive: '#059669',
  tabInactive: '#9ca3af',
  danger: '#dc2626',
  warning: '#f59e0b',
  overlay: 'rgba(0,0,0,0.05)'
};

const dark = {
  mode: 'dark',
  bg: '#0b0f13',
  card: '#161b22',
  text: '#e6edf3',
  textMuted: '#8b949e',
  textDim: '#6e7681',
  border: '#21262d',
  inputBg: '#161b22',
  inputBorder: '#21262d',
  primary: '#10b981',
  primaryText: '#0b0f13',
  chipBg: '#161b22',
  chipBorder: '#21262d',
  chipText: '#c9d1d9',
  chipActiveBg: '#10b981',
  chipActiveText: '#0b0f13',
  tabBar: '#0d1117',
  tabBorder: '#21262d',
  tabActive: '#10b981',
  tabInactive: '#6e7681',
  danger: '#f87171',
  warning: '#fbbf24',
  overlay: 'rgba(255,255,255,0.05)'
};

const Ctx = createContext({ theme: light, toggle: () => {} });

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(light);

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem(KEY);
      if (saved === 'dark') setTheme(dark);
    })();
  }, []);

  async function toggle() {
    const next = theme.mode === 'light' ? dark : light;
    setTheme(next);
    await AsyncStorage.setItem(KEY, next.mode);
  }

  return <Ctx.Provider value={{ theme, toggle }}>{children}</Ctx.Provider>;
}

export const useTheme = () => useContext(Ctx).theme;
export const useThemeToggle = () => useContext(Ctx).toggle;
