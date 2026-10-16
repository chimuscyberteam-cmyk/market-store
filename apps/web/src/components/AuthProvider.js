'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { getUser, setTokens, setUser as saveUser, clearTokens } from '@/lib/api';

const Ctx = createContext(null);

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(getUser());
    setLoading(false);
  }, []);

  function signIn({ user, accessToken, refreshToken }) {
    setTokens({ accessToken, refreshToken });
    saveUser(user);
    setUser(user);
  }
  function updateUser(newUser) {
    saveUser(newUser);
    setUser(newUser);
  }

  function signOut() {
    clearTokens();
    setUser(null);
  }

  return (
    <Ctx.Provider value={{ user, loading, signIn, signOut, updateUser }}>
      {children}
    </Ctx.Provider>
  );
}
export const useAuth = () => useContext(Ctx);
