// src/components/layout/Header.tsx
'use client';

import React from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { useAuthStore, selectUser, selectLogout } from '@/store/useAuthStore';
import { motion } from 'framer-motion';

const Header = () => {
  const { theme, toggleTheme, colors } = useTheme();
  const user = useAuthStore(selectUser);
  const logout = useAuthStore(selectLogout);

  const iconVariants = {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 120 } },
    hover: { scale: 1.1, transition: { type: 'spring', stiffness: 300, damping: 10 } }
  };

  return (
    <motion.header 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="fixed top-0 right-0 h-16 flex items-center justify-between px-8 left-64 z-10 transition-colors duration-200"
      style={{ 
        backgroundColor: colors.background, 
        borderBottom: `1px solid ${colors.border}`,
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)'
      }}
    >
      <div className="flex items-center">
        <h2 className="text-lg font-medium" style={{ color: colors.primary }}>
          {/* Show current page title here if needed */}
        </h2>
      </div>

      <div className="flex items-center space-x-6">
        <motion.div 
          className="relative"
          initial="initial"
          animate="animate"
          whileHover="hover"
          variants={iconVariants}
        >
          <motion.button
            className="p-2.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors relative"
            style={{ 
              backgroundColor: theme === 'light' ? 'rgba(15, 118, 110, 0.1)' : 'rgba(3, 31, 40, 0.3)',
            }}
            aria-label="Notifications"
            whileTap={{ scale: 0.95 }}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              style={{ color: colors.primary }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
          </motion.button>
          <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-800"></span>
        </motion.div>
        
        <motion.button
          onClick={toggleTheme}
          className="p-2.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          style={{ 
            backgroundColor: theme === 'light' ? 'rgba(15, 118, 110, 0.1)' : 'rgba(3, 31, 40, 0.3)',
          }}
          aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          initial="initial"
          animate="animate"
          whileHover="hover"
          whileTap={{ scale: 0.95 }}
          variants={iconVariants}
        >
          {theme === 'light' ? (
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              style={{ color: colors.primary }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
              />
            </svg>
          ) : (
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              style={{ color: colors.text }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          )}
        </motion.button>

        <div className="h-8 w-px bg-gray-300 dark:bg-gray-700 mx-1"></div>
        
        {user && (
          <motion.div 
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="hidden md:block text-right mr-2">
              <p className="text-sm font-medium" style={{ color: colors.text }}>{user.name || 'User'}</p>
              <p className="text-xs opacity-75 capitalize" style={{ color: colors.text }}>{user.role ? user.role.replace('_', ' ') : ''}</p>
            </div>
            
            <motion.button
              onClick={logout}
              className="px-3.5 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5"
              style={{ 
                backgroundColor: theme === 'light' ? '#FEE2E2' : '#7F1D1D',
                color: theme === 'light' ? '#B91C1C' : '#FECACA',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
              }}
              whileHover={{ 
                backgroundColor: theme === 'light' ? '#FEE2E2' : '#991B1B', 
                scale: 1.02 
              }}
              whileTap={{ scale: 0.98 }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </motion.button>
          </motion.div>
        )}
      </div>
    </motion.header>
  );
};

export default Header;