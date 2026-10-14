import { createContext, useContext, useEffect, useState } from 'react';
import { saveAuth, loadAuth, clearAuth } from './auth';
import { setAuthToken, setRefreshToken, setOnTokensUpdated } from './api';

const Ctx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Hydrate from storage on boot
  useEffect(() => {
    (async () => {
      const stored = await loadAuth();
      if (stored) {
        setUser(stored.user);
        setAccessToken(stored.accessToken);
        setAuthToken(stored.accessToken);
        setRefreshToken(stored.refreshToken);
      }
      setLoading(false);
    })();
  }, []);

  // When apiFetch refreshes tokens behind the scenes, keep context in sync
  useEffect(() => {
    setOnTokensUpdated(async ({ accessToken: at, refreshToken: rt, user: u }) => {
      const nextUser = u || user;
      setAccessToken(at);
      if (u) setUser(u);
      await saveAuth({ user: nextUser, accessToken: at, refreshToken: rt });
    });
    return () => setOnTokensUpdated(null);
  }, [user]);

  async function signIn(auth) {
    await saveAuth(auth);
    setUser(auth.user);
    setAccessToken(auth.accessToken);
    setAuthToken(auth.accessToken);
    setRefreshToken(auth.refreshToken);
  }

  async function signOut() {
    await clearAuth();
    setUser(null);
    setAccessToken(null);
    setAuthToken(null);
    setRefreshToken(null);
  }

  return (
    <Ctx.Provider value={{ user, accessToken, loading, signIn, signOut }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
