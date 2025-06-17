// src/components/layout/MainLayout.tsx
'use client';

import React from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { useAuthStore, selectUser, selectIsLoading } from '@/store/useAuthStore';
import { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { usePathname, useRouter } from 'next/navigation';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const { colors } = useTheme();
  const [mounted, setMounted] = useState(false);
  const user = useAuthStore(selectUser);
  const isLoading = useAuthStore(selectIsLoading);

  useEffect(() => {
    setMounted(true);
  }, []);
  const router = useRouter();
  const pathname = usePathname();

  // Check if we're on the login page
  const isLoginPage = pathname === '/login';

  // Redirect to login if not authenticated and not already on login page
  React.useEffect(() => {
    if (!isLoading && !user && !isLoginPage) {
      router.push('/login');
    }
  }, [user, isLoading, router, isLoginPage]);

  // Show loading state
  if (!mounted || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ backgroundColor: colors.background }}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2" style={{ borderColor: colors.primary }}></div>
      </div>
    );
  }

  // If on login page, or not authenticated, don't show layout
  if (isLoginPage || !user) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background, color: colors.text }}>
      <Sidebar />
      <Header />
      <main className="pt-16 pl-64 transition-colors duration-200">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
};

export default MainLayout;