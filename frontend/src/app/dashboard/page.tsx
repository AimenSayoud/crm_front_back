// src/app/dashboard/page.tsx
'use client';

import React from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { useAuthStore, selectUser } from '@/store/useAuthStore';
import Card from '@/components/ui/Card';
import { motion } from 'framer-motion';
//import Badge from '@/components/ui/Badge';
import Link from 'next/link';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  style?: React.CSSProperties;
}

// Make sure BadgeVariant includes 'custom'
type BadgeVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'custom';

const DashboardPage = () => {
  const { colors, theme } = useTheme();
  const user = useAuthStore(selectUser);
  


  // Stats from the screenshot - Modern clean design
  const stats = [
    { 
      name: 'Open Positions', 
      value: '24', 
      change: '+5%', 
      isPositive: true,
      icon: 'briefcase',
      description: 'Active job openings'
    },
    { 
      name: 'Placements', 
      value: '76', 
      change: '+18%',
      isPositive: true, 
      icon: 'users',
      description: 'Successful hires this month'
    },
    { 
      name: 'Avg. Time to Hire', 
      value: '32', 
      subValue: 'days',
      specialText: 'Better',
      specialTextNote: 'Industry avg: 36 days',
      icon: 'clock',
      description: 'Average hiring duration'
    },
    { 
      name: 'Active Recruitments', 
      value: '18', 
      subText: 'From last month',
      icon: 'user-check',
      description: 'Ongoing recruitment processes'
    },
  ];

  // Upcoming activities
  const upcomingActivities = [
    {
      type: "Interview",
      name: "Emma Thompson",
      position: "Senior Developer",
      company: "TechCorp",
      time: "10:00 AM, Today",
      avatar: "E"
    },
    {
      type: "Follow-up",
      name: "Michael Rodriguez",
      position: "Product Manager",
      company: "Innovate Inc.",
      time: "2:30 PM, Today",
      avatar: "M"
    },
    {
      type: "Screening",
      name: "Sarah Chen",
      position: "UX Designer",
      company: "DesignHub",
      time: "9:15 AM, Tomorrow",
      avatar: "S"
    }
  ];

  // Icon renderer
  const getIcon = (type: string, color: string) => {
    const iconProps = {
      className: "w-6 h-6",
      fill: "none",
      stroke: color,
      strokeWidth: 2,
      viewBox: "0 0 24 24"
    };

    switch (type) {
      case 'briefcase':
        return (
          <svg {...iconProps} xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      case 'users':
        return (
          <svg {...iconProps} xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        );
      case 'clock':
        return (
          <svg {...iconProps} xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        );
      case 'user-check':
        return (
          <svg {...iconProps} xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            <polyline points="17 11 19 13 23 9" />
          </svg>
        );
      case 'folder-plus':
        return (
          <svg {...iconProps} xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          </svg>
        );
      case 'folders':
        return (
          <svg {...iconProps} xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 13h.01M8 13h.01" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="pb-6">
      {/* Page header with welcome message */}
      <div className="mb-8">
        <motion.h1 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="text-2xl font-bold" 
          style={{ color: colors.text }}
        >
          Welcome back, {user?.name || 'John'}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 0.7, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
          className="text-sm"
          style={{ color: colors.text }}
        >
          {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} · {user?.role === 'super_admin' ? 'All Offices' : `${user?.officeId || 'Montreal'} Office`}
        </motion.p>
      </div>

      {/* Key metrics - Modern clean design */}
      <motion.div 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, staggerChildren: 0.1 }}
      >
        {stats.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            whileHover={{ 
              y: -2,
              transition: { duration: 0.2 } 
            }}
            className="group relative bg-white dark:bg-gray-800/60 rounded-2xl p-5 border transition-all duration-300 hover:shadow-md"
            style={{ 
              backgroundColor: colors.card,
              borderColor: theme === 'light' ? '#E5E7EB' : '#4B5563',
              boxShadow: theme === 'light' 
                ? '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
                : '0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px 0 rgba(0, 0, 0, 0.24)'
            }}
          >
            {/* Header with icon */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start space-x-3">
                <div 
                  className="p-2 rounded-xl transition-colors duration-200 flex-shrink-0"
                  style={{ 
                    backgroundColor: `${colors.primary}15`,
                  }}
                >
                  {getIcon(stat.icon, colors.primary)}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold leading-tight" 
                      style={{ color: colors.text }}>
                    {stat.name}
                  </h3>
                  <p className="text-xs leading-relaxed mt-1" 
                     style={{ color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
                    {stat.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Main value */}
            <div className="mb-4">
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-bold leading-none" style={{ color: colors.text }}>
                  {stat.value}
                </span>
                {stat.subValue && (
                  <span className="text-lg font-medium leading-none" 
                        style={{ color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
                    {stat.subValue}
                  </span>
                )}
              </div>
            </div>

            {/* Bottom section with change indicator or special info */}
            <div className="flex items-center justify-between">
              <div className="flex-1">
                {stat.change && (
                  <div className="flex items-center space-x-1">
                    <div className={`flex items-center px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                      stat.isPositive
                        ? 'bg-gray-50 text-[#031F28] dark:bg-emerald-900/30 dark:text-emerald-800'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                    }`}>
                      <svg 
                        className={`w-4 h-4 mr-1.5 ${stat.isPositive ? 'rotate-0' : 'rotate-180'}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                      </svg>
                      {stat.change}
                    </div>
                  </div>
                )}
                
                {stat.specialText && (
                  <div className="flex items-center space-x-1">
                    <div className="flex items-center px-3 py-1.5 rounded-full text-sm font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-800 transition-colors">
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {stat.specialText}
                    </div>
                  </div>
                )}

                {stat.subText && (
                  <p className="text-sm font-medium mt-2 leading-relaxed" 
                     style={{ color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
                    {stat.subText}
                  </p>
                )}
              </div>
            </div>

            {/* Special note */}
            {stat.specialTextNote && (
              <div className="mt-3 pt-3 border-t transition-colors" 
                   style={{ borderColor: theme === 'light' ? '#E5E7EB' : '#374151' }}>
                <p className="text-sm font-medium leading-relaxed" 
                   style={{ color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
                  {stat.specialTextNote}
                </p>
              </div>
            )}

            {/* Subtle hover effect indicator */}
            <div 
              className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
              style={{
                background: theme === 'light' 
                  ? 'linear-gradient(145deg, rgba(59, 130, 246, 0.02), rgba(59, 130, 246, 0.05))'
                  : 'linear-gradient(145deg, rgba(59, 130, 246, 0.05), rgba(59, 130, 246, 0.02))'
              }}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Two-column layout for pipeline and upcoming activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recruitment Pipeline Analytics - Enhanced */}
        <motion.div 
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="h-full relative overflow-hidden">
            {/* Strategic Header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="flex items-center mb-2">
                                  <div className="p-2 rounded-lg mr-3" 
                     style={{ backgroundColor: `${colors.primary}15` }}>
                  <svg className="w-5 h-5" fill="none" stroke={colors.primary} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                  <div>
                    <h2 className="text-xl font-bold leading-tight" style={{ color: colors.text }}>
                      Recruitment Analytics
                    </h2>
                    <p className="text-sm mt-1" style={{ color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
                      Real-time pipeline performance & insights
                    </p>
                  </div>
                </div>
                
                {/* Key Performance Indicators */}
                <div className="flex items-center space-x-6 mt-4">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: colors.primary }}></div>
                    <span className="text-sm font-medium" style={{ color: colors.text }}>
                      18% Conversion Rate
                    </span>
                    <div className="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold" 
                         style={{ 
                           backgroundColor: `${colors.primary}15`,
                           color: colors.primary
                         }}>
                      +3.2%
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: colors.primary }}></div>
                    <span className="text-sm font-medium" style={{ color: colors.text }}>
                      23 Days Avg. Time
                    </span>
                    <div className="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold" 
                         style={{ 
                           backgroundColor: `${colors.primary}15`,
                           color: colors.primary
                         }}>
                      -5 days
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-2xl font-bold" style={{ color: colors.text }}>101</p>
                  <p className="text-xs" style={{ color: theme === 'light' ? '#9CA3AF' : '#6B7280' }}>
                    Active Candidates
                  </p>
                </div>
                <Link 
                  href="/pipeline" 
                  className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 hover:scale-105"
                  style={{ 
                    color: colors.primary,
                    backgroundColor: `${colors.primary}10`
                  }}
                >
                  Deep Dive
                  <svg className="w-4 h-4 ml-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Strategic Talent Overview */}
            <div className="mb-6 relative">
              {/* Header with Strategic Focus */}
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-4">
                  <h3 className="text-lg font-semibold" style={{ color: colors.text }}>
                    Talent Acquisition Overview
                  </h3>
                  <div className="flex items-center px-3 py-1 rounded-full" 
                       style={{ backgroundColor: `${colors.primary}15` }}>
                    <div className="w-2 h-2 rounded-full mr-2 animate-pulse" style={{ backgroundColor: colors.primary }}></div>
                    <span className="text-xs font-medium" style={{ color: colors.primary }}>
                      Strategic View
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium" style={{ color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
                    Updated: {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              {/* Strategic Department Performance Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[
                  { 
                    department: 'Engineering', 
                    openRoles: 8, 
                    fillRate: '92%', 
                    avgTime: '28d',
                    priority: 'high'
                  },
                  { 
                    department: 'Sales', 
                    openRoles: 5, 
                    fillRate: '85%', 
                    avgTime: '21d',
                    priority: 'medium'
                  },
                  { 
                    department: 'Marketing', 
                    openRoles: 3, 
                    fillRate: '78%', 
                    avgTime: '19d',
                    priority: 'low'
                  },
                  { 
                    department: 'Operations', 
                    openRoles: 6, 
                    fillRate: '88%', 
                    avgTime: '25d',
                    priority: 'medium'
                  }
                ].map((dept, idx) => (
                  <motion.div
                    key={dept.department}
                    className="p-4 rounded-xl border transition-all duration-200 hover:shadow-sm cursor-pointer"
                    style={{ 
                      backgroundColor: colors.card,
                      borderColor: theme === 'light' ? '#F3F4F6' : '#4B5563'
                    }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + (idx * 0.1), duration: 0.4 }}
                    whileHover={{ y: -2 }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold" style={{ color: colors.text }}>
                        {dept.department}
                      </h4>
                      <div className={`w-2 h-2 rounded-full ${
                        dept.priority === 'high' ? 'bg-red-400' :
                        dept.priority === 'medium' ? 'bg-yellow-400' : 'bg-green-400'
                      }`}></div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs" style={{ color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
                          Open Roles
                        </span>
                        <span className="text-sm font-bold" style={{ color: colors.text }}>
                          {dept.openRoles}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-xs" style={{ color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
                          Fill Rate
                        </span>
                        <span className="text-sm font-bold" style={{ color: colors.primary }}>
                          {dept.fillRate}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-xs" style={{ color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
                          Avg. Time
                        </span>
                        <span className="text-sm font-medium" style={{ color: colors.text }}>
                          {dept.avgTime}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Strategic Insights Bar */}
              <div className="p-4 rounded-xl" 
                   style={{ backgroundColor: `${colors.primary}08` }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5" fill="none" stroke={colors.primary} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <div>
                      <h4 className="text-sm font-semibold" style={{ color: colors.primary }}>
                        Strategic Focus
                      </h4>
                      <p className="text-xs mt-0.5" style={{ color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
                        Engineering roles require immediate attention - 8 positions open
                      </p>
                    </div>
                  </div>
                  <button 
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                    style={{ 
                      backgroundColor: colors.primary,
                      color: 'white'
                    }}
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
            
            {/* Talent Intelligence Dashboard */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-lg font-semibold" style={{ color: colors.text }}>
                  Market Intelligence
                </h4>
                <div className="flex items-center space-x-2">
                  <div className="px-3 py-1 rounded-full text-xs font-medium" 
                       style={{ 
                         backgroundColor: `${colors.primary}15`,
                         color: colors.primary
                       }}>
                    Live Data
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Market Trends */}
                <div className="space-y-4">
                  <div className="p-4 rounded-xl border" 
                       style={{ 
                         backgroundColor: colors.card,
                         borderColor: theme === 'light' ? '#F3F4F6' : '#4B5563'
                       }}>
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="text-sm font-semibold" style={{ color: colors.text }}>
                        Salary Benchmarks
                      </h5>
                      <svg className="w-4 h-4" fill="none" stroke={colors.primary} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-xs" style={{ color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
                          Sr. Engineer
                        </span>
                        <span className="text-sm font-bold" style={{ color: colors.text }}>
                          $125K
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs" style={{ color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
                          Product Manager
                        </span>
                        <span className="text-sm font-bold" style={{ color: colors.text }}>
                          $110K
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs" style={{ color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
                          Sales Director
                        </span>
                        <span className="text-sm font-bold" style={{ color: colors.text }}>
                          $95K
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Competition Analysis */}
                <div className="space-y-4">
                  <div className="p-4 rounded-xl border" 
                       style={{ 
                         backgroundColor: colors.card,
                         borderColor: theme === 'light' ? '#F3F4F6' : '#4B5563'
                       }}>
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="text-sm font-semibold" style={{ color: colors.text }}>
                        Market Activity
                      </h5>
                      <svg className="w-4 h-4" fill="none" stroke={colors.primary} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs" style={{ color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
                          Tech Roles Demand
                        </span>
                        <span className="text-sm font-bold text-green-600">
                          +18%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs" style={{ color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
                          Remote Preference
                        </span>
                        <span className="text-sm font-bold" style={{ color: colors.text }}>
                          73%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs" style={{ color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
                          Competitor Activity
                        </span>
                        <span className="text-sm font-bold text-orange-500">
                          High
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="space-y-4">
                  <div className="p-4 rounded-xl border" 
                       style={{ 
                         backgroundColor: colors.card,
                         borderColor: theme === 'light' ? '#F3F4F6' : '#4B5563'
                       }}>
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="text-sm font-semibold" style={{ color: colors.text }}>
                        AI Recommendations
                      </h5>
                      <svg className="w-4 h-4" fill="none" stroke={colors.primary} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div className="space-y-3 text-xs" style={{ color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
                      <p>• Increase Engineering salary bands by 8%</p>
                      <p>• Focus on remote-first job postings</p>
                      <p>• Expedite screening for competitive roles</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            

          </Card>
        </motion.div>

        {/* Upcoming Activities - Enhanced UI */}
        <motion.div 
          className="lg:col-span-1"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="h-full">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold leading-tight" style={{ color: colors.text }}>
                  Upcoming Activities
                </h2>
                <p className="text-sm mt-1" style={{ color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
                  Next scheduled events
                </p>
              </div>
                              <Link 
                  href="/calendar" 
                  className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 hover:scale-105"
                  style={{ 
                    color: colors.primary,
                    backgroundColor: `${colors.primary}10`
                  }}
                >
                View Calendar
                <svg className="w-4 h-4 ml-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            
            {/* Activities List */}
            <div className="space-y-3">
              {upcomingActivities.map((activity, idx) => (
                <motion.div
                  key={idx}
                  className="group relative bg-white dark:bg-gray-800/30 rounded-xl p-4 border transition-all duration-300 hover:shadow-md cursor-pointer"
                  style={{ 
                    backgroundColor: colors.card,
                    borderColor: theme === 'light' ? '#F3F4F6' : '#4B5563',
                    boxShadow: theme === 'light' 
                      ? '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                      : '0 1px 2px 0 rgba(0, 0, 0, 0.2)'
                  }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + (idx * 0.1), duration: 0.4 }}
                  whileHover={{ 
                    y: -1,
                    transition: { duration: 0.2 } 
                  }}
                >
                  {/* Activity header with badge and time */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
                         style={{ 
                           backgroundColor: `${colors.primary}15`,
                           color: colors.primary
                         }}>
                      <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: colors.primary }}></div>
                      {activity.type}
                      
                      {/* Activity type icons */}
                      {activity.type === "Interview" && (
                        <svg className="w-3.5 h-3.5 ml-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      )}
                      {activity.type === "Follow-up" && (
                        <svg className="w-3.5 h-3.5 ml-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      )}
                      {activity.type === "Screening" && (
                        <svg className="w-3.5 h-3.5 ml-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      )}
                    </div>
                    
                    <div className="flex items-center px-3 py-1 rounded-lg text-xs font-medium" 
                         style={{ 
                           backgroundColor: theme === 'light' ? '#F9FAFB' : '#374151',
                           color: theme === 'light' ? '#374151' : '#D1D5DB' 
                         }}>
                      <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {activity.time}
                    </div>
                  </div>

                  {/* Main content */}
                  <div className="flex items-start space-x-3">
                    {/* Enhanced Avatar */}
                    <div className="relative flex-shrink-0">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-sm ring-2 ring-white dark:ring-gray-700 transition-transform group-hover:scale-105"
                        style={{ 
                          backgroundColor: colors.primary,
                          background: `linear-gradient(135deg, ${colors.primary}, ${colors.primary}dd)`
                        }}
                      >
                        {activity.avatar}
                      </div>
                      {/* Online status indicator */}
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800"
                           style={{ backgroundColor: colors.primary }}></div>
                    </div>

                    {/* Person info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-base font-semibold leading-tight truncate" style={{ color: colors.text }}>
                          {activity.name}
                        </h3>
                        <button 
                          className="opacity-0 group-hover:opacity-100 transition-all duration-200 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                          aria-label="View activity details"
                        >
                          <svg className="w-4 h-4" fill="none" stroke={colors.primary} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                      
                      <p className="text-sm font-medium leading-relaxed mb-1" 
                         style={{ color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
                        {activity.position}
                      </p>
                      
                      <div className="flex items-center text-xs" 
                           style={{ color: theme === 'light' ? '#9CA3AF' : '#6B7280' }}>
                        <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        {activity.company}
                      </div>
                    </div>
                  </div>

                  {/* Hover effect overlay */}
                  <div 
                    className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{
                      background: theme === 'light' 
                        ? 'linear-gradient(145deg, rgba(59, 130, 246, 0.02), rgba(59, 130, 246, 0.04))'
                        : 'linear-gradient(145deg, rgba(59, 130, 246, 0.05), rgba(59, 130, 246, 0.02))'
                    }}
                  />
                </motion.div>
              ))}
            </div>
            
            {/* Footer */}
            <div className="mt-6 pt-4 border-t transition-colors" 
                 style={{ borderColor: theme === 'light' ? '#F3F4F6' : '#374151' }}>
                              <Link 
                  href="/activities"
                  className="flex items-center justify-center w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-[1.02]"
                  style={{ 
                    color: colors.primary,
                    backgroundColor: `${colors.primary}08`,
                    border: `1px solid ${colors.primary}20`
                  }}
                >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                View All Activities
              </Link>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Quick action cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.4 }}
          whileHover={{ 
            y: -3,
            boxShadow: theme === 'light' 
              ? '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025)'
              : '0 10px 15px -3px rgba(0, 0, 0, 0.2), 0 4px 6px -2px rgba(0, 0, 0, 0.15)',
          }}
        >
          <Link href="/projects/new">
            <Card>
              <div className="flex items-center justify-center flex-col py-6">
                <div 
                  className="p-4 rounded-full mb-3"
                  style={{ backgroundColor: `${colors.primary}15` }}
                >
                  {getIcon('folder-plus', colors.primary)}
                </div>
                <h3 className="text-lg font-medium mb-1" style={{ color: colors.text }}>Create New Project</h3>
                <p className="text-sm text-center" style={{ color: `${colors.text}99` }}>Define roles and requirements</p>
              </div>
            </Card>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3, duration: 0.4 }}
          whileHover={{ 
            y: -3,
            boxShadow: theme === 'light' 
              ? '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025)'
              : '0 10px 15px -3px rgba(0, 0, 0, 0.2), 0 4px 6px -2px rgba(0, 0, 0, 0.15)',
          }}
        >
          <Link href="/projects">
            <Card>
              <div className="flex items-center justify-center flex-col py-6">
                <div 
                  className="p-4 rounded-full mb-3"
                  style={{ backgroundColor: `${colors.primary}15` }}
                >
                  {getIcon('folders', colors.primary)}
                </div>
                <h3 className="text-lg font-medium mb-1" style={{ color: colors.text }}>View All Projects</h3>
                <p className="text-sm text-center" style={{ color: `${colors.text}99` }}>Manage recruitment campaigns</p>
              </div>
            </Card>
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default DashboardPage;