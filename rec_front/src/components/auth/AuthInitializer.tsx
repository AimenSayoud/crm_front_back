// src/components/auth/AuthInitializer.tsx
'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';

interface AuthInitializerProps {
  children: React.ReactNode;
}

export const AuthInitializer = ({ children }: AuthInitializerProps) => {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  useEffect(() => {
    // Initialize auth state on app load
    initializeAuth();
  }, [initializeAuth]);

  return <>{children}</>;
};