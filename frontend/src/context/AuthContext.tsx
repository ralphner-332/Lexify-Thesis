import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api } from '../api/client';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  token: string | null;
  isDemo: boolean;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  quickLogin: (role: UserRole) => Promise<void>;
  logout: () => void;
  acceptDisclaimer: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('yawa_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await api.auth.me();
        setUser(res.user);
      } catch (err) {
        console.warn('Session expired or invalid, logging out.');
        localStorage.removeItem('yawa_token');
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }
    loadUser();
  }, [token]);

  const login = async (email: string, password?: string) => {
    setIsLoading(true);
    try {
      const res = await api.auth.login({ email, password });
      if (!res || !res.token || !res.user) {
        throw new Error('Authentication response did not contain a valid session token or user.');
      }
      localStorage.setItem('yawa_token', res.token);
      setToken(res.token);
      setUser(res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const quickLogin = async (targetRole: UserRole) => {
    setIsLoading(true);
    try {
      const res = await api.auth.quickLogin(targetRole);
      if (!res || !res.token || !res.user) {
        throw new Error('Quick login response did not contain a valid session token or user.');
      }
      localStorage.setItem('yawa_token', res.token);
      setToken(res.token);
      setUser(res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('yawa_token');
    setToken(null);
    setUser(null);
  };

  const acceptDisclaimer = async () => {
    const res = await api.auth.acceptDisclaimer();
    if (user) {
      setUser({ ...user, disclaimerAcceptedAt: res.disclaimerAcceptedAt });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        token,
        isDemo: user?.isDemo || false,
        isLoading,
        login,
        quickLogin,
        logout,
        acceptDisclaimer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
