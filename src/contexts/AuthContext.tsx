import React, { createContext, useContext, useState, useEffect } from 'react';
import { logError } from '@/lib/errorLogger';

const _w = window as any;

interface User {
  ID: number;
  Name: string;
  Email: string;
  CreateTime: string;
  Roles: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  checkAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{children: React.ReactNode;}> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const { data, error } = await _w.ezsite.apis.getUserInfo();
      if (error || !data) {
        setUser(null);
      } else {
        setUser(data);
      }
    } catch (err) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await _w.ezsite.apis.logout();
      setUser(null);
    } catch (err) {
      logError('Logout', err);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        checkAuth,
        logout
      }}>

      {children}
    </AuthContext.Provider>);

};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};