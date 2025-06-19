// src/context/AuthContext.tsx
'use client';

import React, { createContext, useState, useContext, useEffect } from 'react';

export type UserRole = 'super_admin' | 'admin' | 'employee';
export type OfficeId = '1' | '2' | '3';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  officeId: OfficeId;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  canAccessOffice: (officeId: OfficeId) => boolean;
  canAccess: (requiredRole: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if the user is logged in
    const checkAuth = async () => {
      try {
        // For now, simulate auth with localStorage
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
      } catch (error) {
        console.error('Auth error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      // For now, simulate a successful login with mock data
      // Replace with actual API call later
      const mockUser: User = {
        id: '1',
        name: 'Test User',
        email,
        role: email.includes('super') ? 'super_admin' : email.includes('admin') ? 'admin' : 'employee',
        officeId: '1',
      };
      
      setUser(mockUser);
      localStorage.setItem('user', JSON.stringify(mockUser));
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const canAccessOffice = (officeId: OfficeId) => {
    if (!user) return false;
    
    // Super admin can access all offices
    if (user.role === 'super_admin') return true;
    
    // Other roles can only access their assigned office
    return user.officeId === officeId;
  };

  const canAccess = (requiredRole: UserRole) => {
    if (!user) return false;
    
    // Access levels hierarchy
    const roleHierarchy: Record<UserRole, number> = {
      'super_admin': 3,
      'admin': 2,
      'employee': 1
    };
    
    return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, canAccessOffice, canAccess }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};