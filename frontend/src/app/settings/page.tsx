// src/app/settings/page.tsx
'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/app/context/ThemeContext';
import { useAuthStore, selectUser } from '@/store/useAuthStore';

// Modern Icons
const icons = {
  user: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  bell: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  ),
  shield: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  ),
  paint: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
    </svg>
  ),
  globe: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
    </svg>
  ),
  key: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
    </svg>
  ),
  database: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
    </svg>
  ),
  link: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
    </svg>
  ),
  logout: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
    </svg>
  ),
  moon: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  ),
  sun: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  check: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  camera: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
};

const SettingsPage = () => {
  const { colors, theme, toggleTheme } = useTheme();
  const currentUser = useAuthStore(selectUser);
  const [activeSection, setActiveSection] = useState('account');
  const [profileImage, setProfileImage] = useState('/api/placeholder/120/120');
  
  // Get user initials
  const getUserInitials = () => {
    const name = currentUser?.name || 'John Doe';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name[0].toUpperCase();
  };
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
    updates: true,
    newsletter: false
  });
  const [privacy, setPrivacy] = useState({
    profileVisibility: 'team',
    showEmail: false,
    showPhone: false,
    activityStatus: true
  });

  // Quick settings cards data
  const quickSettings = [
    { id: 'theme', icon: theme === 'dark' ? icons.moon : icons.sun, label: 'Theme', value: theme === 'dark' ? 'Dark' : 'Light', action: toggleTheme },
    { id: 'language', icon: icons.globe, label: 'Language', value: 'English' },
    { id: 'notifications', icon: icons.bell, label: 'Notifications', value: notifications.email ? 'On' : 'Off' },
    { id: 'security', icon: icons.shield, label: '2FA', value: 'Enabled', status: 'success' }
  ];

  // Settings sections
  const sections = [
    { id: 'account', label: 'Account', icon: icons.user },
    { id: 'notifications', label: 'Notifications', icon: icons.bell },
    { id: 'privacy', label: 'Privacy & Security', icon: icons.shield },
    { id: 'appearance', label: 'Appearance', icon: icons.paint },
    { id: 'integrations', label: 'Integrations', icon: icons.link },
    { id: 'data', label: 'Data & Storage', icon: icons.database }
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
      {/* Hero Section with Profile */}
      <div className="relative overflow-hidden" style={{ backgroundColor: colors.surface }}>
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row items-center md:items-start gap-8"
          >
            {/* Profile Section */}
            <div className="flex flex-col items-center">
              <div className="relative group">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                  className="w-32 h-32 rounded-full shadow-xl flex items-center justify-center ring-4"
                  style={{ 
                    background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
                    ringColor: colors.surface 
                  }}
                >
                  <span className="text-4xl font-bold text-white select-none">
                    {getUserInitials()}
                  </span>
                </motion.div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="absolute bottom-0 right-0 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity border"
                  style={{ 
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.text
                  }}
                >
                  {icons.camera}
                </motion.button>
              </div>
              <h2 className="mt-4 text-2xl font-bold" style={{ color: colors.text }}>
                {currentUser?.name || 'John Doe'}
              </h2>
              <p className="text-sm" style={{ color: colors.textSecondary }}>
                {currentUser?.email || 'john.doe@recruitmentplus.com'}
              </p>
              <span className="mt-2 px-3 py-1 text-xs font-medium rounded-full" style={{
                backgroundColor: `${colors.primary}20`,
                color: colors.primary
              }}>
                {currentUser?.role?.replace('_', ' ').toUpperCase() || 'ADMIN'}
              </span>
            </div>

            {/* Quick Settings Grid */}
            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
              {quickSettings.map((setting, index) => (
                <motion.div
                  key={setting.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -4 }}
                  onClick={setting.action}
                  className="cursor-pointer rounded-xl p-4 shadow-sm hover:shadow-md transition-all border"
                  style={{ 
                    backgroundColor: colors.card,
                    borderColor: colors.border
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div style={{ color: colors.primary }}>{setting.icon}</div>
                    {setting.status && (
                      <span className={`w-2 h-2 rounded-full ${setting.status === 'success' ? 'bg-green-500' : 'bg-gray-400'}`} />
                    )}
                  </div>
                  <p className="text-xs" style={{ color: colors.textSecondary }}>{setting.label}</p>
                  <p className="text-sm font-medium" style={{ color: colors.text }}>{setting.value}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:w-64 space-y-1"
          >
            {sections.map((section, index) => (
              <motion.button
                key={section.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  activeSection === section.id
                    ? 'shadow-md'
                    : ''
                }`}
                style={{
                  backgroundColor: activeSection === section.id 
                    ? `${colors.primary}10`
                    : 'transparent',
                  borderLeft: activeSection === section.id ? `3px solid ${colors.primary}` : '3px solid transparent',
                  color: activeSection === section.id ? colors.primary : colors.text
                }}
                onMouseEnter={(e) => {
                  if (activeSection !== section.id) {
                    e.currentTarget.style.backgroundColor = `${colors.text}05`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeSection !== section.id) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                {section.icon}
                <span className="font-medium">{section.label}</span>
              </motion.button>
            ))}
            
            {/* Logout Button */}
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: sections.length * 0.05 }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl mt-8 transition-all"
              style={{ color: colors.error }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `${colors.error}10`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {icons.logout}
              <span className="font-medium">Logout</span>
            </motion.button>
          </motion.aside>

          {/* Content Area */}
          <div className="flex-1">
            <AnimatePresence mode="wait">
              {/* Account Settings */}
              {activeSection === 'account' && (
                <motion.div
                  key="account"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="rounded-2xl shadow-sm p-6" style={{ backgroundColor: colors.card }}>
                    <h3 className="text-lg font-semibold mb-6" style={{ color: colors.text }}>
                      Personal Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                          First Name
                        </label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 rounded-lg border transition-colors focus:outline-none focus:ring-2"
                          style={{ 
                            borderColor: colors.border,
                            backgroundColor: colors.background,
                            color: colors.text,
                            focusBorderColor: colors.primary
                          }}
                          defaultValue="John"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                          Last Name
                        </label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 rounded-lg border transition-colors focus:outline-none focus:ring-2"
                          style={{ 
                            borderColor: colors.border,
                            backgroundColor: colors.background,
                            color: colors.text,
                            focusBorderColor: colors.primary
                          }}
                          defaultValue="Doe"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                          Email
                        </label>
                        <input
                          type="email"
                          className="w-full px-4 py-3 rounded-lg border transition-colors focus:outline-none focus:ring-2"
                          style={{ 
                            borderColor: colors.border,
                            backgroundColor: colors.background,
                            color: colors.text,
                            focusBorderColor: colors.primary
                          }}
                          defaultValue={currentUser?.email || 'john.doe@recruitmentplus.com'}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                          Phone
                        </label>
                        <input
                          type="tel"
                          className="w-full px-4 py-3 rounded-lg border transition-colors focus:outline-none focus:ring-2"
                          style={{ 
                            borderColor: colors.border,
                            backgroundColor: colors.background,
                            color: colors.text,
                            focusBorderColor: colors.primary
                          }}
                          defaultValue="+1 (555) 123-4567"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end mt-6">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="px-6 py-3 rounded-lg font-medium text-white"
                        style={{ backgroundColor: colors.primary }}
                      >
                        Save Changes
                      </motion.button>
                    </div>
                  </div>

                  {/* Password Change */}
                  <div className="rounded-2xl shadow-sm p-6" style={{ backgroundColor: colors.card }}>
                    <h3 className="text-lg font-semibold mb-6" style={{ color: colors.text }}>
                      Change Password
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                          Current Password
                        </label>
                        <input
                          type="password"
                          className="w-full px-4 py-3 rounded-lg border transition-colors focus:outline-none focus:ring-2"
                          style={{ 
                            borderColor: colors.border,
                            backgroundColor: colors.background,
                            color: colors.text,
                            focusBorderColor: colors.primary
                          }}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                            New Password
                          </label>
                          <input
                            type="password"
                            className="w-full px-4 py-3 rounded-lg border transition-colors focus:outline-none focus:ring-2"
                            style={{ 
                              borderColor: colors.border,
                              backgroundColor: colors.background,
                              color: colors.text,
                              focusBorderColor: colors.primary
                            }}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                            Confirm Password
                          </label>
                          <input
                            type="password"
                            className="w-full px-4 py-3 rounded-lg border transition-colors focus:outline-none focus:ring-2"
                            style={{ 
                              borderColor: colors.border,
                              backgroundColor: colors.background,
                              color: colors.text,
                              focusBorderColor: colors.primary
                            }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-6">
                      <a href="#" className="text-sm font-medium" style={{ color: colors.primary }}>
                        Forgot password?
                      </a>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="px-6 py-3 rounded-lg font-medium"
                        style={{ 
                          backgroundColor: `${colors.primary}20`,
                          color: colors.primary
                        }}
                      >
                        Update Password
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Notifications Settings */}
              {activeSection === 'notifications' && (
                <motion.div
                  key="notifications"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="rounded-2xl shadow-sm p-6" style={{ backgroundColor: colors.card }}>
                    <h3 className="text-lg font-semibold mb-6" style={{ color: colors.text }}>
                      Notification Preferences
                    </h3>
                    <div className="space-y-4">
                      {Object.entries({
                        email: { label: 'Email Notifications', desc: 'Receive updates via email' },
                        push: { label: 'Push Notifications', desc: 'Get browser push notifications' },
                        sms: { label: 'SMS Notifications', desc: 'Receive text messages for urgent updates' },
                        updates: { label: 'Product Updates', desc: 'New features and improvements' },
                        newsletter: { label: 'Newsletter', desc: 'Weekly digest and tips' }
                      }).map(([key, config]) => (
                        <motion.div
                          key={key}
                          className="flex items-center justify-between p-4 rounded-lg transition-colors"
                          style={{ backgroundColor: colors.background }}
                        >
                          <div>
                            <p className="font-medium" style={{ color: colors.text }}>{config.label}</p>
                            <p className="text-sm" style={{ color: colors.textSecondary }}>{config.desc}</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={notifications[key as keyof typeof notifications]}
                              onChange={(e) => setNotifications(prev => ({ ...prev, [key]: e.target.checked }))}
                            />
                            <div 
                              className="w-11 h-6 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"
                              style={{
                                backgroundColor: notifications[key as keyof typeof notifications] ? colors.primary : colors.border
                              }}
                            />
                          </label>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Notification Schedule */}
                  <div className="rounded-2xl shadow-sm p-6" style={{ backgroundColor: colors.card }}>
                    <h3 className="text-lg font-semibold mb-6" style={{ color: colors.text }}>
                      Quiet Hours
                    </h3>
                    <p className="text-sm mb-4" style={{ color: colors.textSecondary }}>
                      Pause notifications during specific hours
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                          From
                        </label>
                        <input
                          type="time"
                          defaultValue="22:00"
                          className="w-full px-4 py-3 rounded-lg border transition-colors focus:outline-none focus:ring-2"
                          style={{ 
                            borderColor: colors.border,
                            backgroundColor: colors.background,
                            color: colors.text,
                            focusBorderColor: colors.primary
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                          To
                        </label>
                        <input
                          type="time"
                          defaultValue="08:00"
                          className="w-full px-4 py-3 rounded-lg border transition-colors focus:outline-none focus:ring-2"
                          style={{ 
                            borderColor: colors.border,
                            backgroundColor: colors.background,
                            color: colors.text,
                            focusBorderColor: colors.primary
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Privacy & Security Settings */}
              {activeSection === 'privacy' && (
                <motion.div
                  key="privacy"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="rounded-2xl shadow-sm p-6" style={{ backgroundColor: colors.card }}>
                    <h3 className="text-lg font-semibold mb-6" style={{ color: colors.text }}>
                      Privacy Settings
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                          Profile Visibility
                        </label>
                        <select
                          className="w-full px-4 py-3 rounded-lg border transition-colors focus:outline-none focus:ring-2"
                          style={{ 
                            borderColor: colors.border,
                            backgroundColor: colors.background,
                            color: colors.text,
                            focusBorderColor: colors.primary
                          }}
                          value={privacy.profileVisibility}
                          onChange={(e) => setPrivacy(prev => ({ ...prev, profileVisibility: e.target.value }))}
                        >
                          <option value="public">Public</option>
                          <option value="team">Team Only</option>
                          <option value="private">Private</option>
                        </select>
                      </div>
                      <div className="space-y-3">
                        {[
                          { key: 'showEmail', label: 'Show email address on profile' },
                          { key: 'showPhone', label: 'Show phone number on profile' },
                          { key: 'activityStatus', label: 'Show online status' }
                        ].map(({ key, label }) => (
                          <label key={key} className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              className="w-4 h-4 rounded"
                              style={{ accentColor: colors.primary }}
                              checked={privacy[key as keyof typeof privacy] as boolean}
                              onChange={(e) => setPrivacy(prev => ({ ...prev, [key]: e.target.checked }))}
                            />
                            <span className="text-sm" style={{ color: colors.text }}>{label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Security Features */}
                  <div className="rounded-2xl shadow-sm p-6" style={{ backgroundColor: colors.card }}>
                    <h3 className="text-lg font-semibold mb-6" style={{ color: colors.text }}>
                      Security Features
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 rounded-lg" style={{ backgroundColor: `${colors.primary}10` }}>
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg text-white" style={{ backgroundColor: colors.primary }}>
                            {icons.key}
                          </div>
                          <div>
                            <p className="font-medium" style={{ color: colors.text }}>Two-Factor Authentication</p>
                            <p className="text-sm" style={{ color: colors.textSecondary }}>Add an extra layer of security</p>
                          </div>
                        </div>
                        <span className="text-sm font-medium" style={{ color: colors.secondary }}>Enabled</span>
                      </div>
                      
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full p-4 rounded-lg border-2 border-dashed transition-colors hover:border-solid"
                        style={{ 
                          borderColor: colors.border,
                          backgroundColor: colors.background
                        }}
                      >
                        <p className="font-medium" style={{ color: colors.text }}>View Login History</p>
                        <p className="text-sm" style={{ color: colors.textSecondary }}>See recent account activity</p>
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Appearance Settings */}
              {activeSection === 'appearance' && (
                <motion.div
                  key="appearance"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="rounded-2xl shadow-sm p-6" style={{ backgroundColor: colors.card }}>
                    <h3 className="text-lg font-semibold mb-6" style={{ color: colors.text }}>
                      Theme & Colors
                    </h3>
                    
                    {/* Theme Selector */}
                    <div className="grid grid-cols-3 gap-4 mb-8">
                      {[
                        { id: 'light', label: 'Light', preview: 'bg-white' },
                        { id: 'dark', label: 'Dark', preview: 'bg-gray-800' },
                        { id: 'auto', label: 'System', preview: 'bg-gradient-to-r from-white to-gray-800' }
                      ].map((themeOption) => (
                        <motion.button
                          key={themeOption.id}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => themeOption.id !== 'auto' && toggleTheme()}
                          className={`relative p-4 rounded-xl border-2 transition-all ${
                            (themeOption.id === 'light' && theme === 'light') || 
                            (themeOption.id === 'dark' && theme === 'dark')
                              ? 'shadow-lg' 
                              : ''
                          }`}
                          style={{
                            borderColor: (themeOption.id === 'light' && theme === 'light') || 
                                       (themeOption.id === 'dark' && theme === 'dark')
                                       ? colors.primary 
                                       : colors.border,
                            backgroundColor: colors.card
                          }}
                        >
                          <div className={`w-full h-20 rounded-lg mb-3 ${themeOption.preview}`} />
                          <p className="text-sm font-medium" style={{ color: colors.text }}>
                            {themeOption.label}
                          </p>
                          {((themeOption.id === 'light' && theme === 'light') || 
                            (themeOption.id === 'dark' && theme === 'dark')) && (
                            <div className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: colors.primary }}>
                              {icons.check}
                            </div>
                          )}
                        </motion.button>
                      ))}
                    </div>

                    {/* Accent Colors */}
                    <div>
                      <p className="text-sm font-medium mb-3" style={{ color: colors.textSecondary }}>
                        Accent Color
                      </p>
                      <div className="flex gap-3">
                        {['#3B82F6', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#EF4444', '#6B7280'].map((color) => (
                          <motion.button
                            key={color}
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                            className="w-10 h-10 rounded-full shadow-md relative"
                            style={{ backgroundColor: color }}
                          >
                            {color === colors.primary && (
                              <div className="absolute inset-0 rounded-full border-2 border-white" />
                            )}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Font & Display */}
                  <div className="rounded-2xl shadow-sm p-6" style={{ backgroundColor: colors.card }}>
                    <h3 className="text-lg font-semibold mb-6" style={{ color: colors.text }}>
                      Display Preferences
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                          Font Size
                        </label>
                        <input
                          type="range"
                          min="12"
                          max="20"
                          defaultValue="16"
                          className="w-full"
                          style={{ accentColor: colors.primary }}
                        />
                        <div className="flex justify-between text-xs mt-1" style={{ color: colors.textSecondary }}>
                          <span>Small</span>
                          <span>Large</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                          Content Width
                        </label>
                        <select
                          className="w-full px-4 py-3 rounded-lg border transition-colors focus:outline-none focus:ring-2"
                          style={{ 
                            borderColor: colors.border,
                            backgroundColor: colors.background,
                            color: colors.text,
                            focusBorderColor: colors.primary
                          }}
                        >
                          <option>Compact</option>
                          <option>Normal</option>
                          <option>Wide</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Integrations */}
              {activeSection === 'integrations' && (
                <motion.div
                  key="integrations"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="rounded-2xl shadow-sm p-6" style={{ backgroundColor: colors.card }}>
                    <h3 className="text-lg font-semibold mb-6" style={{ color: colors.text }}>
                      Connected Services
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { name: 'Google Calendar', icon: '📅', connected: true },
                        { name: 'Slack', icon: '💬', connected: true },
                        { name: 'LinkedIn', icon: '💼', connected: false },
                        { name: 'Microsoft Teams', icon: '👥', connected: false },
                      ].map((service) => (
                        <div
                          key={service.name}
                          className="flex items-center justify-between p-4 rounded-lg border"
                          style={{ 
                            borderColor: colors.border,
                            backgroundColor: colors.background
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{service.icon}</span>
                            <div>
                              <p className="font-medium" style={{ color: colors.text }}>{service.name}</p>
                              <p className="text-xs" style={{ color: colors.textSecondary }}>
                                {service.connected ? 'Connected' : 'Not connected'}
                              </p>
                            </div>
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-4 py-2 rounded-lg text-sm font-medium"
                            style={{
                              backgroundColor: service.connected ? colors.background : colors.primary,
                              color: service.connected ? colors.text : 'white',
                              border: service.connected ? `1px solid ${colors.border}` : 'none'
                            }}
                          >
                            {service.connected ? 'Disconnect' : 'Connect'}
                          </motion.button>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Data & Storage */}
              {activeSection === 'data' && (
                <motion.div
                  key="data"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="rounded-2xl shadow-sm p-6" style={{ backgroundColor: colors.card }}>
                    <h3 className="text-lg font-semibold mb-6" style={{ color: colors.text }}>
                      Storage Usage
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm" style={{ color: colors.text }}>Used Space</span>
                          <span className="text-sm font-medium" style={{ color: colors.text }}>2.4 GB of 5 GB</span>
                        </div>
                        <div className="w-full rounded-full h-2" style={{ backgroundColor: colors.border }}>
                          <div className="h-2 rounded-full" style={{ width: '48%', backgroundColor: colors.primary }}></div>
                        </div>
                      </div>
                      
                      <div className="space-y-2 pt-4">
                        {[
                          { type: 'Documents', size: '1.2 GB', color: colors.primary },
                          { type: 'Images', size: '800 MB', color: colors.secondary },
                          { type: 'Others', size: '400 MB', color: colors.success }
                        ].map((item) => (
                          <div key={item.type} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                              <span className="text-sm" style={{ color: colors.text }}>{item.type}</span>
                            </div>
                            <span className="text-sm" style={{ color: colors.textSecondary }}>{item.size}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Data Management */}
                  <div className="rounded-2xl shadow-sm p-6" style={{ backgroundColor: colors.card }}>
                    <h3 className="text-lg font-semibold mb-6" style={{ color: colors.text }}>
                      Data Management
                    </h3>
                    <div className="space-y-3">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full p-4 rounded-lg text-left transition-colors"
                        style={{ 
                          backgroundColor: colors.background,
                          borderColor: colors.border
                        }}
                      >
                        <p className="font-medium" style={{ color: colors.text }}>Export Your Data</p>
                        <p className="text-sm" style={{ color: colors.textSecondary }}>Download all your information</p>
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full p-4 rounded-lg text-left transition-colors"
                        style={{ backgroundColor: `${colors.error}10` }}
                      >
                        <p className="font-medium" style={{ color: colors.error }}>Delete Account</p>
                        <p className="text-sm" style={{ color: colors.error, opacity: 0.8 }}>Permanently remove your account and data</p>
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;