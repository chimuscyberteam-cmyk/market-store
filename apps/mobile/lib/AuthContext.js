import { createContext, useContext, useEffect, useState } from 'react';
import { saveAuth, loadAuth, clearAuth } from './auth';

const Ctx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const stored = await loadAuth();
      if (stored) {
        setUser(stored.user);
        setAccessToken(stored.accessToken);
      }
      setLoading(false);
    })();
  }, []);

  async function signIn(auth) {
    await saveAuth(auth);
    setUser(auth.user);
    setAccessToken(auth.accessToken);
  }

  async function signOut() {
    await clearAuth();
    setUser(null);
    setAccessToken(null);
  }

  return (
    <Ctx.Provider value={{ user, accessToken, loading, signIn, signOut }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
