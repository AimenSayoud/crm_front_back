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
  
  // More refined animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.08,
        ease: "easeOut"
      }
    }
  };

  const itemVariants = {
    hidden: { y: 15, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { 
        type: "spring", 
        stiffness: 80, 
        damping: 12 
      }
    }
  };

  const chartVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { 
        duration: 0.5, 
        delay: 0.2,
        ease: [0.25, 0.1, 0.25, 1.0]
      }
    }
  };

  // Stats from the screenshot
  const stats = [
    { 
      name: 'Open Positions', 
      value: '24', 
      change: '+5%', 
      isPositive: true,
      icon: 'briefcase',
      bgColor: theme === 'light' 
        ? 'from-blue-50/80 to-blue-100/90' 
        : 'from-blue-900/20 to-blue-800/25',
      iconColor: theme === 'light' ? '#3B82F6' : '#60A5FA'
    },
    { 
      name: 'Placements', 
      value: '76', 
      change: '+18%',
      isPositive: true, 
      icon: 'users',
      bgColor: theme === 'light' 
        ? 'from-emerald-50/80 to-emerald-100/90' 
        : 'from-emerald-900/20 to-emerald-800/25',
      iconColor: theme === 'light' ? '#10B981' : '#34D399'
    },
    { 
      name: 'Avg. Time to Hire', 
      value: '32', 
      subValue: 'days',
      specialText: 'Better',
      specialTextNote: 'Industry avg: 36 days',
      icon: 'clock',
      bgColor: theme === 'light' 
        ? 'from-amber-50/80 to-amber-100/90' 
        : 'from-amber-900/20 to-amber-800/25',
      iconColor: theme === 'light' ? '#F59E0B' : '#FBBF24'
    },
    { 
      name: 'Active Recruitments', 
      value: '18', 
      subText: 'From last month',
      icon: 'user-check',
      bgColor: theme === 'light' 
        ? 'from-violet-50/80 to-violet-100/90' 
        : 'from-violet-900/20 to-violet-800/25',
      iconColor: theme === 'light' ? '#8B5CF6' : '#A78BFA'
    },
  ];

  // Recruitment pipeline data
  const pipelineStages = [
    { stage: "Applied", count: 45, color: theme === 'light' ? "#3B82F6" : "#60A5FA" }, // Blue
    { stage: "Screening", count: 28, color: theme === 'light' ? "#0EA5E9" : "#38BDF8" }, // Light blue
    { stage: "Interview", count: 16, color: theme === 'light' ? "#10B981" : "#34D399" }, // Green
    { stage: "Offer", count: 8, color: theme === 'light' ? "#8B5CF6" : "#A78BFA" }, // Purple
    { stage: "Hired", count: 4, color: theme === 'light' ? "#22C55E" : "#4ADE80" }, // Success green
  ];

  // Upcoming activities
  const upcomingActivities = [
    {
      type: "Interview",
      name: "Emma Thompson",
      position: "Senior Developer",
      company: "TechCorp",
      time: "10:00 AM, Today",
      avatar: "E",
      color: theme === 'light' ? '#10B981' : '#34D399' // Green
    },
    {
      type: "Follow-up",
      name: "Michael Rodriguez",
      position: "Product Manager",
      company: "Innovate Inc.",
      time: "2:30 PM, Today",
      avatar: "M",
      color: theme === 'light' ? '#3B82F6' : '#60A5FA' // Blue
    },
    {
      type: "Screening",
      name: "Sarah Chen",
      position: "UX Designer",
      company: "DesignHub",
      time: "9:15 AM, Tomorrow",
      avatar: "S",
      color: theme === 'light' ? '#8B5CF6' : '#A78BFA' // Purple
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

  // Calculate total candidates for pipeline percentage
  const totalCandidates = pipelineStages.reduce((sum, stage) => sum + stage.count, 0);

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

      {/* Key metrics */}
      <motion.div 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {stats.map((stat) => (
          <motion.div
            key={stat.name}
            variants={itemVariants}
            whileHover={{ 
              y: -4, 
              boxShadow: theme === 'light' 
                ? '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025)'
                : '0 10px 15px -3px rgba(0, 0, 0, 0.2), 0 4px 6px -2px rgba(0, 0, 0, 0.15)',
              transition: { duration: 0.2 } 
            }}
            className="p-5 rounded-xl border overflow-hidden relative"
            style={{ 
              backgroundColor: colors.card,
              borderColor: theme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)',
              boxShadow: theme === 'light' 
                ? '0 4px 6px -1px rgba(0, 0, 0, 0.03), 0 2px 4px -1px rgba(0, 0, 0, 0.02)'
                : '0 4px 6px -1px rgba(0, 0, 0, 0.15), 0 2px 4px -1px rgba(0, 0, 0, 0.1)'
            }}
          >
            <div className="flex justify-between items-start">
              <div className="relative z-10">
                <p className="text-sm font-medium opacity-75" style={{ color: colors.text }}>
                  {stat.name}
                </p>
                <div className="flex items-baseline mt-1">
                  <p className="text-2xl font-bold" style={{ color: colors.text }}>
                    {stat.value}
                  </p>
                  {stat.subValue && (
                    <span className="ml-1 text-base opacity-75" style={{ color: colors.text }}>
                      {stat.subValue}
                    </span>
                  )}
                </div>
                {stat.change && (
                  <div
                    className={`mt-1 text-sm flex items-center font-medium ${
                      stat.isPositive
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                    {stat.change}
                  </div>
                )}
                {stat.specialText && (
                  <div
                    className="mt-1 text-sm flex items-center font-medium text-emerald-600 dark:text-emerald-400"
                  >
                    → {stat.specialText}
                  </div>
                )}
                {stat.specialTextNote && (
                  <p className="text-xs mt-0.5 opacity-60" style={{ color: colors.text }}>
                    {stat.specialTextNote}
                  </p>
                )}
                {stat.subText && (
                  <p className="text-xs mt-0.5 opacity-60" style={{ color: colors.text }}>
                    {stat.subText}
                  </p>
                )}
              </div>
              <div 
                className="p-3 rounded-full bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm border border-white/60 dark:border-gray-700/30"
                style={{ color: stat.iconColor }}
              >
                {getIcon(stat.icon, stat.iconColor)}
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Two-column layout for pipeline and upcoming activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recruitment Pipeline - Optimized Spacing */}
        <motion.div 
          className="lg:col-span-2"
          initial="hidden"
          animate="visible"
          variants={chartVariants}
        >
          <Card className="h-full">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold" style={{ color: colors.text }}>
                Recruitment Pipeline
              </h2>
              <Link href="/pipeline" className="text-sm font-medium flex items-center" style={{ color: colors.primary }}>
                View Details
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Pipeline progress bar - Improved height and spacing */}
            <div className="mb-3 relative">
              <div className="h-3 flex rounded-lg overflow-hidden">
                {pipelineStages.map((stage, idx) => {
                  const percentage = (stage.count / totalCandidates) * 100;
                  return (
                    <motion.div
                      key={stage.stage}
                      className="h-full relative group"
                      style={{ 
                        backgroundColor: stage.color,
                        width: `${percentage}%` 
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ 
                        duration: 0.8, 
                        delay: 0.5 + (idx * 0.1), 
                        ease: [0.25, 0.1, 0.25, 1.0] 
                      }}
                      whileHover={{ opacity: 0.9 }}
                    >
                      {/* Compact tooltip on hover */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        <div className="bg-white dark:bg-gray-800 text-xs font-medium px-2 py-1 rounded shadow-md whitespace-nowrap"
                            style={{ 
                              color: colors.text, 
                              borderBottom: `2px solid ${stage.color}` 
                            }}>
                          {stage.stage}: {stage.count} ({Math.round(percentage)}%)
                        </div>
                      </div>
                      {/* Divider between segments except the last one */}
                      {idx < pipelineStages.length - 1 && (
                        <div className="absolute right-0 top-0 w-px h-full bg-white dark:bg-gray-900 opacity-30"></div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
            
            {/* Pipeline stages - Compact and efficient layout */}
            <div className="grid grid-cols-5 gap-1">
              {pipelineStages.map((stage, idx) => (
                <motion.div 
                  key={stage.stage}
                  className="text-center p-1.5 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + (idx * 0.1), duration: 0.4 }}
                  whileHover={{ y: -1 }}
                >
                  <div className="flex items-center justify-center mb-1">
                    <div 
                      className="w-2 h-2 rounded-full mr-1.5" 
                      style={{ backgroundColor: stage.color }}
                    />
                    <span className="text-xs font-medium" style={{ color: colors.text }}>{stage.stage}</span>
                  </div>
                  <div className="flex items-center justify-center">
                    <p className="text-lg font-bold" style={{ color: colors.text }}>
                      {stage.count}
                    </p>
                    <span className="text-xs opacity-70 ml-1" style={{ color: colors.text }}>
                      ({Math.round((stage.count / totalCandidates) * 100)}%)
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
            
            {/* Add timeline visualization */}
            <div className="mt-3 pt-2 border-t border-b pb-2" style={{ borderColor: theme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)' }}>
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium" style={{ color: `${colors.text}99` }}>
                  <span className="inline-block mr-1">📊</span> 
                  Total Candidates: {totalCandidates}
                </span>
                <span className="text-xs font-medium" style={{ color: `${colors.text}99` }}>
                  Average time in pipeline: 18 days
                  <span className="inline-block ml-1">⏱</span>
                </span>
              </div>
            </div>
            
            {/* Simple Recruitment Flow Chart */}
            <div className="mt-4 mb-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-3 opacity-70" style={{ color: colors.text }}>
                Recruitment Flow
              </h3>
              
              <div className="flex items-center justify-between relative">
                {/* Flow steps with connecting lines */}
                <div className="absolute top-1/2 left-0 right-0 h-0.5" style={{ backgroundColor: `${colors.text}15` }}></div>
                
                {/* Flow step nodes with animations */}
                {[
                  { name: 'Source', icon: 'search', color: theme === 'light' ? '#3B82F6' : '#60A5FA' },
                  { name: 'Screen', icon: 'filter', color: theme === 'light' ? '#0EA5E9' : '#38BDF8' },
                  { name: 'Interview', icon: 'users', color: theme === 'light' ? '#10B981' : '#34D399' },
                  { name: 'Offer', icon: 'file', color: theme === 'light' ? '#8B5CF6' : '#A78BFA' },
                  { name: 'Hire', icon: 'check', color: theme === 'light' ? '#22C55E' : '#4ADE80' }
                ].map((step, idx) => (
                  <motion.div 
                    key={step.name}
                    className="z-10 flex flex-col items-center"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ 
                      delay: 1.5 + (idx * 0.15),
                      duration: 0.5,
                      type: "spring",
                      stiffness: 100
                    }}
                  >
                    <motion.div 
                      className="w-10 h-10 rounded-full flex items-center justify-center mb-2 relative"
                      style={{ 
                        backgroundColor: `${step.color}20`,
                        border: `2px solid ${step.color}`
                      }}
                      whileHover={{ 
                        scale: 1.1, 
                        backgroundColor: `${step.color}30`,
                        transition: { duration: 0.2 } 
                      }}
                    >
                      {/* Step Icon */}
                      {step.icon === 'search' && (
                        <svg className="w-4 h-4" fill="none" stroke={step.color} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      )}
                      {step.icon === 'filter' && (
                        <svg className="w-4 h-4" fill="none" stroke={step.color} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                        </svg>
                      )}
                      {step.icon === 'users' && (
                        <svg className="w-4 h-4" fill="none" stroke={step.color} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      )}
                      {step.icon === 'file' && (
                        <svg className="w-4 h-4" fill="none" stroke={step.color} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      )}
                      {step.icon === 'check' && (
                        <svg className="w-4 h-4" fill="none" stroke={step.color} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      
                      {/* Animated pulse effect */}
                      <motion.div
                        className="absolute inset-0 rounded-full"
                        style={{ border: `2px solid ${step.color}` }}
                        animate={{
                          scale: [1, 1.1, 1],
                          opacity: [1, 0.7, 1]
                        }}
                        transition={{
                          duration: 2,
                          ease: "easeInOut",
                          repeat: Infinity,
                          repeatDelay: idx * 0.5
                        }}
                      />
                    </motion.div>
                    <span className="text-xs font-medium" style={{ color: colors.text }}>
                      {step.name}
                    </span>
                    
                    {/* Display step metrics */}
                    <span 
                      className="text-xs mt-1 px-1.5 py-0.5 rounded-full" 
                      style={{ 
                        color: step.color,
                        backgroundColor: `${step.color}15`
                      }}
                    >
                      {step.name === 'Source' ? '100%' :
                       step.name === 'Screen' ? '62%' :
                       step.name === 'Interview' ? '36%' :
                       step.name === 'Offer' ? '18%' : '9%'}
                    </span>
                  </motion.div>
                ))}
                
                {/* Connecting arrows animation */}
                {[0, 1, 2, 3].map((idx) => (
                  <motion.div
                    key={`arrow-${idx}`}
                    className="absolute top-1/2 transform -translate-y-1/2"
                    style={{ 
                      left: `${19 + (idx * 20)}%`,
                      color: theme === 'light' ? '#6B7280' : '#9CA3AF'  
                    }}
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ 
                      delay: 2 + (idx * 0.15),
                      duration: 0.3
                    }}
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Candidate Flow Chart */}
            <div className="mt-3">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider opacity-70" style={{ color: colors.text }}>
                  Monthly Candidate Flow
                </h3>
                <div className="flex items-center gap-3">
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: theme === 'light' ? '#3B82F6' : '#60A5FA' }}></div>
                    <span className="text-xs" style={{ color: colors.text }}>New</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: theme === 'light' ? '#10B981' : '#34D399' }}></div>
                    <span className="text-xs" style={{ color: colors.text }}>Hired</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-0.5 mr-1" style={{ backgroundColor: theme === 'light' ? '#EC4899' : '#F472B6' }}></div>
                    <span className="text-xs" style={{ color: colors.text }}>Trend</span>
                  </div>
                </div>
              </div>
              
              {/* Bar Chart */}
              <div className="relative h-32">
                <div className="absolute inset-0 flex items-end justify-between px-0.5">
                  {/* Calculate trend line points for smoother visualization */}
                  {(() => {
                    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
                    const pointData = months.map((month, idx) => {
                      // Generate random but consistent heights for the chart bars
                      const newHeight = 30 + (idx * 5) + (idx % 2 === 0 ? 15 : -5) + (idx === 5 ? 10 : 0);
                      return {
                        month,
                        x: (idx / (months.length - 1)) * 100, // convert to percentage
                        y: 100 - newHeight, // convert to top position percentage
                        height: newHeight
                      };
                    });
                    
                    // Create SVG path for trend line
                    const pathData = pointData.map((point, idx) => 
                      (idx === 0 ? 'M' : 'L') + `${point.x}% ${point.y}%`
                    ).join(' ');

                    return (
                      <>
                        {/* Trend Line SVG */}
                        <svg className="absolute inset-0 z-10 pointer-events-none" preserveAspectRatio="none" width="100%" height="100%">
                          <motion.path
                            d={pathData}
                            fill="none"
                            stroke={theme === 'light' ? '#EC4899' : '#F472B6'}
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 1 }}
                            transition={{ duration: 1.5, delay: 2, ease: "easeInOut" }}
                          />
                          {/* Dots at each point */}
                          {pointData.map((point, idx) => (
                            <motion.circle
                              key={`dot-${idx}`}
                              cx={`${point.x}%`}
                              cy={`${point.y}%`}
                              r="3"
                              fill={theme === 'light' ? '#FFFFFF' : '#1F2937'}
                              stroke={theme === 'light' ? '#EC4899' : '#F472B6'}
                              strokeWidth="1.5"
                              initial={{ opacity: 0, scale: 0 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.3, delay: 2 + (idx * 0.1) }}
                            />
                          ))}
                        </svg>

                        {months.map((month, idx) => {
                          const newHeight = pointData[idx].height;
                          const hiredHeight = 10 + (idx * 3) + (idx % 2 === 0 ? 5 : 3) + (idx === 5 ? 5 : 0);
                          const maxHeight = Math.max(newHeight, hiredHeight);
                          
                          return (
                            <div key={month} className="flex-1 flex flex-col items-center">
                              <div className="w-full relative" style={{ height: `${maxHeight}%` }}>
                                {/* New Candidates Bar */}
                                <motion.div 
                                  className="absolute bottom-0 left-0 right-0 mx-1.5 rounded-t"
                                  style={{ 
                                    backgroundColor: theme === 'light' ? 'rgba(59, 130, 246, 0.7)' : 'rgba(96, 165, 250, 0.7)',
                                    height: `${newHeight}%`
                                  }}
                                  initial={{ height: 0 }}
                                  animate={{ height: `${newHeight}%` }}
                                  transition={{ 
                                    duration: 0.8, 
                                    delay: 1.2 + (idx * 0.1),
                                    ease: "easeOut" 
                                  }}
                                  whileHover={{ 
                                    backgroundColor: theme === 'light' ? 'rgba(59, 130, 246, 0.9)' : 'rgba(96, 165, 250, 0.9)'
                                  }}
                                />
                                
                                {/* Hired Candidates Bar (narrower) */}
                                <motion.div 
                                  className="absolute bottom-0 left-1/4 right-1/4 mx-1.5 rounded-t"
                                  style={{ 
                                    backgroundColor: theme === 'light' ? 'rgba(16, 185, 129, 0.7)' : 'rgba(52, 211, 153, 0.7)',
                                    height: `${hiredHeight}%`
                                  }}
                                  initial={{ height: 0 }}
                                  animate={{ height: `${hiredHeight}%` }}
                                  transition={{ 
                                    duration: 0.8, 
                                    delay: 1.4 + (idx * 0.1),
                                    ease: "easeOut" 
                                  }}
                                  whileHover={{ 
                                    backgroundColor: theme === 'light' ? 'rgba(16, 185, 129, 0.9)' : 'rgba(52, 211, 153, 0.9)'
                                  }}
                                />
                              </div>
                              <span 
                                className="text-xs mt-1 font-medium" 
                                style={{ color: `${colors.text}90` }}
                              >
                                {month}
                              </span>
                            </div>
                          );
                        })}
                      </>
                    );
                  })()}
                </div>
                
                {/* Horizontal grid lines */}
                <div className="absolute inset-0 flex flex-col justify-between">
                  {[0, 1, 2].map((line) => (
                    <div 
                      key={line} 
                      className="w-full border-t border-dashed"
                      style={{ borderColor: `${colors.text}15` }}
                    />
                  ))}
                </div>
              </div>
              
              {/* Hover tooltip - shows on bar hover */}
              <div className="hidden absolute bg-white dark:bg-gray-800 p-2 rounded shadow-md text-xs z-20">
                <div className="font-medium">April 2023</div>
                <div className="flex justify-between gap-4">
                  <span>New: 52</span>
                  <span className="text-green-600 dark:text-green-400">+12%</span>
                </div>
              </div>
            </div>
            
            {/* Quick stats below chart */}
            <div className="flex justify-between items-center mt-2 pt-2 text-xs" style={{ color: `${colors.text}99` }}>
              <span>+12% new candidates vs last month</span>
              <span>Conversion rate: 9.8%</span>
              <span className="text-pink-500 dark:text-pink-400 font-medium">↗ Upward trend</span>
            </div>
          </Card>
        </motion.div>

        {/* Upcoming Activities */}
        <motion.div 
          className="lg:col-span-1"
          initial="hidden"
          animate="visible"
          variants={chartVariants}
        >
          <Card className="h-full">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-semibold" style={{ color: colors.text }}>
                Upcoming Activities
              </h2>
              <Link href="/calendar" className="text-sm font-medium flex items-center" style={{ color: colors.primary }}>
                View Calendar
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            
            <div className="space-y-4">
              {upcomingActivities.map((activity, idx) => (
                <motion.div
                  key={idx}
                  className="rounded-lg border p-3"
                  style={{ 
                    borderColor: theme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)',
                  }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 + (idx * 0.1), duration: 0.4 }}
                  whileHover={{ 
                    y: -2, 
                    boxShadow: theme === 'light' 
                      ? '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.025)'
                      : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    transition: { duration: 0.2 } 
                  }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: `${activity.color}15`,
                        color: activity.color,
                        border: `1px solid ${activity.color}30`,
                      }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: activity.color }}></div>
                      {activity.type}
                    </div>
                    <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800" 
                      style={{ color: `${colors.text}99` }}>
                      {activity.time}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold mr-3 shadow-sm"
                      style={{ 
                        background: `linear-gradient(135deg, ${activity.color}, ${activity.color}cc)`
                      }}
                    >
                      {activity.avatar}
                    </div>
                    <div className="overflow-hidden">
                      <div className="flex items-center">
                        <p className="font-medium truncate" style={{ color: colors.text }}>{activity.name}</p>
                        
                        {/* Activity type indicator icons */}
                        {activity.type === "Interview" && (
                          <svg className="w-3.5 h-3.5 ml-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        )}
                        {activity.type === "Follow-up" && (
                          <svg className="w-3.5 h-3.5 ml-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        )}
                        {activity.type === "Screening" && (
                          <svg className="w-3.5 h-3.5 ml-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2H5a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                          </svg>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs truncate max-w-[160px]" style={{ color: `${colors.text}99` }}>
                          {activity.position} · {activity.company}
                        </p>
                        <div className="ml-2 flex-shrink-0">
                          <button className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
                            <svg className="w-3.5 h-3.5" fill="none" stroke={colors.primary} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            
            <div className="mt-4 text-center">
              <Link 
                href="/activities"
                className="text-sm font-medium px-0 py-1 w-full inline-block transition-colors rounded hover:bg-gray-50 dark:hover:bg-gray-800"
                style={{ color: colors.primary }}
              >
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
                  style={{ backgroundColor: theme === 'light' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.15)' }}
                >
                  {getIcon('folder-plus', theme === 'light' ? '#3B82F6' : '#60A5FA')}
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
                  style={{ backgroundColor: theme === 'light' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.15)' }}
                >
                  {getIcon('folders', theme === 'light' ? '#8B5CF6' : '#A78BFA')}
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