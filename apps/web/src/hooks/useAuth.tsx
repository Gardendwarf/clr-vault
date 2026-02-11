import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { api, ApiError } from '@/lib/api';
import type { AuthUser, AuthResponse } from '@clr-vault/shared';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const token = localStorage.getItem('clrvault_access_token');
      if (!token) {
        setUser(null);
        setIsLoading(false);
        return;
      }
      const userData = await api.get<AuthUser>('/api/auth/me');
      setUser(userData);
    } catch {
      setUser(null);
      localStorage.removeItem('clrvault_access_token');
      localStorage.removeItem('clrvault_refresh_token');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await api.post<AuthResponse>('/api/auth/login', { email, password });
    localStorage.setItem('clrvault_access_token', data.tokens.accessToken);
    localStorage.setItem('clrvault_refresh_token', data.tokens.refreshToken);
    setUser(data.user);
  }, []);

  const register = useCallback(async (email: string, password: string, name?: string) => {
    const data = await api.post<AuthResponse>('/api/auth/register', { email, password, name });
    localStorage.setItem('clrvault_access_token', data.tokens.accessToken);
    localStorage.setItem('clrvault_refresh_token', data.tokens.refreshToken);
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('clrvault_refresh_token');
      await api.post('/api/auth/logout', { refreshToken });
    } catch {
      // Ignore logout errors
    } finally {
      localStorage.removeItem('clrvault_access_token');
      localStorage.removeItem('clrvault_refresh_token');
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export { ApiError };
