import React, { createContext, useState, useEffect } from 'react';

import type { StoredUserData } from '../interfaces/types';

import { getUserData } from '../utils/auth';
import { logoutUser } from '../utils/authApi';

export interface AuthContextType {
  user: StoredUserData | null;
  setUser: (user: StoredUserData | null) => void;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<StoredUserData | null>(null);

  useEffect(() => {
    const userData = getUserData();
    setUser(userData);
  }, []);

  const logout = async (): Promise<void> => {
    try {
      await logoutUser();
    } catch (error) {
      console.error('Logout error:', error);
      // Continue with local cleanup even if server call fails
    } finally {
      // Clear local user state (localStorage is already cleared by logoutUser)
      setUser(null);
    }
  };

  const isAuthenticated = user !== null;

  return (
    <AuthContext.Provider value={{ user, setUser, isAuthenticated, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
