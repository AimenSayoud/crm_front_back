// src/components/layout/Header.tsx
'use client';

import React, { useState } from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { useAuthStore, selectUser, selectLogout } from '@/store/useAuthStore';
import { motion, AnimatePresence } from 'framer-motion';
import { useSidebar } from '@/app/context/SidebarContext';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

const Header = () => {
  const { theme, toggleTheme, colors } = useTheme();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const user = useAuthStore(selectUser);
  const logout = useAuthStore(selectLogout);
  const pathname = usePathname();
  
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Page title mapping
  const getPageTitle = (path: string) => {
    const titleMap: { [key: string]: string } = {
      '/dashboard': 'Dashboard',
      '/candidates': 'Candidates',
      '/companies': 'Companies',
      '/analysis': 'Analytics',
      '/calendar': 'Calendar',
      '/automation': 'Automation',
      '/ai-assistant': 'AI Assistant',
      '/messaging': 'Messages',
      '/team': 'Team Management',
      '/settings': 'Settings',
    };
    return titleMap[path] || 'Dashboard';
  };

  // Get breadcrumb
  const getBreadcrumb = (path: string) => {
    const segments = path.split('/').filter(Boolean);
    return segments.map(segment => segment.charAt(0).toUpperCase() + segment.slice(1));
  };

  const currentTitle = getPageTitle(pathname);
  const breadcrumb = getBreadcrumb(pathname);

  // Using inline animations for better TypeScript compatibility

  return (
    <motion.header 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={`fixed top-0 right-0 h-16 flex items-center justify-between z-30 transition-all duration-300 ease-in-out ${
        isCollapsed ? 'left-20' : 'left-64'
      }`}
      style={{ 
        backgroundColor: theme === 'light' 
          ? 'rgba(255, 255, 255, 0.95)' 
          : 'rgba(2, 20, 27, 0.95)',
        backdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${theme === 'light' ? 'rgba(229, 231, 235, 0.8)' : 'rgba(55, 65, 81, 0.8)'}`,
        boxShadow: theme === 'light' 
          ? '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.1)' 
          : '0 1px 3px 0 rgba(0, 0, 0, 0.2), 0 1px 2px 0 rgba(0, 0, 0, 0.3)'
      }}
    >
      {/* Left Section */}
      <div className="flex items-center px-6 w-full">
        {/* Sidebar Toggle Button */}
        <motion.button
          onClick={toggleSidebar}
          className="p-2 rounded-lg transition-all duration-200 mr-3 group flex-shrink-0"
          style={{ 
            backgroundColor: theme === 'light' 
              ? 'rgba(15, 118, 110, 0.08)' 
              : 'rgba(3, 31, 40, 0.4)',
            border: `1px solid ${theme === 'light' ? 'rgba(15, 118, 110, 0.15)' : 'rgba(3, 31, 40, 0.6)'}`,
          }}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1, transition: { duration: 0.3 } }}
          whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
          whileTap={{ scale: 0.95 }}
        >
          <motion.svg
            className="w-4 h-4 group-hover:scale-110 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            style={{ color: colors.primary }}
            animate={{ rotate: isCollapsed ? 0 : 180 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </motion.svg>
        </motion.button>
        
        {/* Page Title & Breadcrumb */}
        <div className="flex flex-col mr-4 flex-shrink-0">
          <motion.h1 
            className="text-base font-semibold tracking-tight"
            style={{ color: colors.text }}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            {currentTitle}
          </motion.h1>
          <motion.div 
            className="flex items-center text-[11px] font-medium opacity-60"
            style={{ color: colors.text }}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <span>CRM</span>
            {breadcrumb.map((item, index) => (
              <React.Fragment key={index}>
                <svg className="w-2.5 h-2.5 mx-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <span className="capitalize">{item}</span>
              </React.Fragment>
            ))}
          </motion.div>
        </div>

        {/* Search Bar - Better proportioned */}
        <div className="flex-1 max-w-md mx-6 relative">
          <div className="relative flex items-center">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search candidates, jobs, companies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-opacity-50 text-sm transition-all duration-200"
              style={{ 
                backgroundColor: theme === 'light' ? 'rgba(243, 244, 246, 0.8)' : 'rgba(55, 65, 81, 0.5)',
                color: colors.text,
                boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.05)',
                border: `1px solid ${theme === 'light' ? 'rgba(229, 231, 235, 0.8)' : 'rgba(75, 85, 99, 0.4)'}`,
              }}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                aria-label="Clear search"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center px-6 space-x-4 flex-shrink-0">
        {/* Notifications */}
        <motion.div 
          className="relative"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1, transition: { duration: 0.3 } }}
          whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
        >
          <motion.button
            className="p-2 rounded-lg transition-all duration-200 relative group"
            style={{ 
              backgroundColor: theme === 'light' ? 'rgba(15, 118, 110, 0.08)' : 'rgba(3, 31, 40, 0.4)',
              border: `1px solid ${theme === 'light' ? 'rgba(15, 118, 110, 0.15)' : 'rgba(3, 31, 40, 0.6)'}`,
            }}
            aria-label="Notifications"
            whileTap={{ scale: 0.95 }}
          >
            <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: colors.primary }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <motion.span 
              className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 500, damping: 30 }}
            >
              3
            </motion.span>
          </motion.button>
        </motion.div>
        
        {/* Theme Toggle */}
        <motion.button
          onClick={toggleTheme}
          className="p-2 rounded-lg transition-all duration-200 group"
          style={{ 
            backgroundColor: theme === 'light' ? 'rgba(15, 118, 110, 0.08)' : 'rgba(3, 31, 40, 0.4)',
            border: `1px solid ${theme === 'light' ? 'rgba(15, 118, 110, 0.15)' : 'rgba(3, 31, 40, 0.6)'}`,
          }}
          aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1, transition: { duration: 0.3, delay: 0.1 } }}
          whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
          whileTap={{ scale: 0.95 }}
        >
          <motion.div
            initial={{ rotate: 0 }}
            animate={{ rotate: theme === 'light' ? 0 : 180 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            {theme === 'light' ? (
              <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: colors.primary }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: colors.primary }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            )}
          </motion.div>
        </motion.button>

        {/* Divider */}
        <div 
          className="h-8 w-px mx-3" 
          style={{ backgroundColor: theme === 'light' ? 'rgba(229, 231, 235, 0.8)' : 'rgba(55, 65, 81, 0.8)' }}
        />
        
        {/* User Profile */}
        {user && (
          <div className="relative">
            <motion.button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-3 p-2 rounded-lg transition-all duration-200 group"
              style={{ 
                backgroundColor: showUserMenu 
                  ? theme === 'light' ? 'rgba(15, 118, 110, 0.12)' : 'rgba(3, 31, 40, 0.6)'
                  : 'transparent',
                border: `1px solid ${showUserMenu ? (theme === 'light' ? 'rgba(15, 118, 110, 0.15)' : 'rgba(3, 31, 40, 0.6)') : 'transparent'}`,
              }}
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1, transition: { duration: 0.3, delay: 0.2 } }}
              whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center space-x-3 min-w-0">
                <div className="hidden md:block text-right mr-3">
                  <p className="text-sm font-semibold leading-tight truncate" style={{ color: colors.text }}>
                    {user.name || 'User'}
                  </p>
                  <p className="text-xs opacity-70 capitalize leading-tight" style={{ color: colors.text }}>
                    {user.role ? user.role.replace('_', ' ') : 'User'}
                  </p>
                </div>
                
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-400 to-teal-600 dark:from-teal-700 dark:to-teal-900 flex items-center justify-center text-white font-bold shadow-sm ring-2 ring-white dark:ring-gray-800">
                    {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-white dark:border-gray-800"></div>
                </div>
                
                <motion.svg 
                  className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 flex-shrink-0" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  animate={{ rotate: showUserMenu ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </motion.svg>
              </div>
            </motion.button>

            {/* User Dropdown Menu */}
            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  className="absolute right-0 top-full mt-2 w-64 py-2 rounded-2xl shadow-xl border z-50"
                  style={{ 
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    boxShadow: theme === 'light' 
                      ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                      : '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.2)'
                  }}
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.2 } }}
                  exit={{ opacity: 0, y: -10, scale: 0.95, transition: { duration: 0.15 } }}
                >
                  <div className="px-4 py-3 border-b" style={{ borderColor: colors.border }}>
                    <p className="text-sm font-semibold" style={{ color: colors.text }}>{user.name}</p>
                    <p className="text-xs opacity-60" style={{ color: colors.text }}>{user.email}</p>
                  </div>
                  
                  <div className="py-2">
                    <Link href="/settings" className="flex items-center px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors" style={{ color: colors.text }}>
                      <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Profile Settings
                    </Link>
                    <Link href="/settings" className="flex items-center px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors" style={{ color: colors.text }}>
                      <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Preferences
                    </Link>
                  </div>
                  
                  <div className="border-t py-2" style={{ borderColor: colors.border }}>
                    <motion.button
                      onClick={logout}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign Out
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Click outside to close menu */}
      {showUserMenu && (
        <div 
          className="fixed inset-0 z-20" 
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </motion.header>
  );
};

export default Header;