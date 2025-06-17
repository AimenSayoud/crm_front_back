// src/components/layout/Sidebar.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/app/context/ThemeContext';
import { useAuthStore, selectUser, selectCanAccess } from '@/store/useAuthStore';
import Image from 'next/image';
import { motion } from 'framer-motion';

interface SidebarItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  requiredRole?: 'employee' | 'admin' | 'super_admin';
}

const Sidebar = () => {
  const pathname = usePathname();
  const { theme, colors } = useTheme();
  const user = useAuthStore(selectUser);
  const canAccess = useAuthStore(selectCanAccess);
  
  // Animation variants
  const sidebarVariants = {
    hidden: { opacity: 0, x: -15 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { 
        type: 'spring',
        stiffness: 80,
        damping: 20,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -8 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: i * 0.03,
        duration: 0.25,
        ease: "easeOut"
      }
    })
  };

  const sidebarItems: SidebarItem[] = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
    },
    {
      name: 'Candidates',
      path: '/candidates',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
    },
    {
      name: 'Companies',
      path: '/companies',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
    },
    {
      name: 'Analysis',
      path: '/analysis',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
    },
    {
      name: 'Calendar',
      path: '/calendar',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
    },
    {
      name: 'Automation',
      path: '/automation',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
      requiredRole: 'admin',
    },
    {
      name: 'AI Assistant',
      path: '/ai-assistant',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
    },
    {
      name: 'Messaging',
      path: '/messaging',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>,
    },
    {
      name: 'Team',
      path: '/team',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
      requiredRole: 'admin',
    },
    {
      name: 'Settings',
      path: '/settings',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
      requiredRole: 'admin',
    },
  ];

  const filteredItems = sidebarItems.filter(item => 
    !item.requiredRole || (user && canAccess(item.requiredRole))
  );

  // Animation variants
  const childVariants = itemVariants;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={sidebarVariants}
      className="fixed h-full w-64 flex flex-col shadow-lg z-20 transition-colors duration-200"
      style={{ 
        backgroundColor: colors.sidebar,
        borderRight: `1px solid ${colors.border}` 
      }}
    >
      <div className="flex justify-center py-6 border-b" style={{ borderColor: colors.border }}>
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.4, 
            ease: [0.25, 0.1, 0.25, 1.0],
            delay: 0.2
          }}
        >
          <Image 
            src="/logo.png" 
            alt="RecrutementPlus Logo"
            width={220} 
            height={70}
            className="object-contain"
            priority
          />
        </motion.div>
      </div>
      
      <div className="overflow-y-auto flex-1 py-6">
        <motion.div
          className="px-3 mb-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ delay: 0.3, duration: 0.3 }}
        >
          <h3 className="text-xs font-semibold uppercase tracking-wider px-3 mb-2" 
            style={{ color: theme === 'light' ? colors.secondary : '#A3A3A3' }}>
            Main Navigation
          </h3>
        </motion.div>
        
        <nav>
          <ul className="space-y-1 px-3">
            {filteredItems.map((item, idx) => {
              const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);
              
              return (
                <motion.li 
                  key={item.path}
                  custom={idx} 
                  initial="hidden"
                  animate="visible"
                  variants={childVariants}
                >
                  <Link href={item.path}>
                    <motion.div
                      className={`flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                        isActive ? 'font-medium' : 'font-normal'
                      }`}
                      style={{
                        backgroundColor: isActive 
                          ? theme === 'light' ? '#D1FAE5' : '#164E63'
                          : 'transparent',
                        border: isActive 
                          ? `1px solid ${theme === 'light' ? colors.primary + '40' : colors.primary + '50'}` 
                          : '1px solid transparent',
                        boxShadow: isActive 
                          ? theme === 'light' ? '0 2px 5px rgba(15, 118, 110, 0.08)' : 'none' 
                          : 'none',
                      }}
                      whileHover={{
                        backgroundColor: isActive 
                          ? theme === 'light' ? '#D1FAE5' : '#164E63'
                          : theme === 'light' ? 'rgba(229, 231, 235, 0.5)' : 'rgba(55, 65, 81, 0.5)',
                        x: 3,
                        transition: { 
                          duration: 0.2, 
                          ease: "easeOut" 
                        }
                      }}
                      whileTap={{ scale: 0.985 }}
                      transition={{
                        backgroundColor: { duration: 0.15 },
                        boxShadow: { duration: 0.15 }
                      }}
                    >
                      <motion.span 
                        className="inline-flex items-center justify-center w-6 h-6 mr-3"
                        style={{ 
                          color: isActive 
                            ? colors.primary
                            : theme === 'light' ? '#6B7280' : '#9CA3AF'
                        }}
                        whileHover={!isActive ? { 
                          scale: 1.1,
                          color: colors.primary,
                          transition: { duration: 0.2 }
                        } : {}}
                      >
                        {item.icon}
                      </motion.span>
                      <span 
                        className={`${isActive ? 'font-medium' : ''} text-sm`}
                        style={{
                          color: isActive 
                            ? colors.primary
                            : colors.text
                        }}
                      >
                        {item.name}
                      </span>
                    </motion.div>
                  </Link>
                </motion.li>
              );
            })}
          </ul>
        </nav>
      </div>

      {user && (
        <motion.div 
          className="p-4 mt-auto border-t"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            delay: 0.4, 
            duration: 0.3,
            ease: "easeOut"
          }}
          style={{ borderColor: colors.border }}
        >
          <div className="flex items-center px-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 dark:from-teal-700 dark:to-teal-900 flex items-center justify-center text-white font-medium shadow-sm">
              {user.name ? user.name.charAt(0).toUpperCase() : '?'}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium" style={{ color: colors.text }}>{user.name || 'User'}</p>
              <p className="text-xs opacity-75 capitalize" style={{ color: colors.text }}>{user.role ? user.role.replace('_', ' ') : ''}</p>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Sidebar;