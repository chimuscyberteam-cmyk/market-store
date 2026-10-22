'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { getUser, setTokens, setUser as saveUser, clearTokens } from '@/lib/api';
import { useRouter } from 'next/navigation';

const AuthContext = createContext({ user: null, loading: true });

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedUser = getUser();
    setUser(storedUser);
    setLoading(false);
  }, []);

  const signIn = (userData, accessToken, refreshToken) => {
    setTokens(accessToken, refreshToken);
    saveUser(userData);
    setUser(userData);
  };

  const signOut = () => {
    clearTokens();
    setUser(null);
    router.push('/');
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
