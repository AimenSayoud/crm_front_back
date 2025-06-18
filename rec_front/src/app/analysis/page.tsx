'use client';

import React from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import Card from '@/components/ui/Card';
import { motion } from 'framer-motion';
import Badge from '@/components/ui/Badge';

const AnalysisPage = () => {
  const { colors, theme } = useTheme();

  // Animation variants
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

  // Sample metrics
  const metrics = [
    { 
      title: 'Hiring Efficiency',
      value: '83%',
      change: '+5%',
      isPositive: true,
      description: 'Average time to fill positions',
      icon: 'clock',
      color: colors.primary,
    },
    { 
      title: 'Candidate Conversion',
      value: '24%',
      change: '+2%',
      isPositive: true,
      description: 'Applications to interview ratio',
      icon: 'users',
      color: colors.primary,
    },
    { 
      title: 'Offer Acceptance',
      value: '91%',
      change: '+1%',
      isPositive: true,
      description: 'Offers accepted by candidates',
      icon: 'check-square',
      color: colors.primary,
    },
    { 
      title: 'Cost per Hire',
      value: '$4,250',
      change: '-8%',
      isPositive: true,
      description: 'Average cost per successful hire',
      icon: 'dollar-sign',
      color: colors.primary,
    },
  ];

  // Render metric icon
  const getMetricIcon = (type: string, color: string) => {
    const iconProps = {
      className: "w-6 h-6",
      fill: "none",
      stroke: color,
      strokeWidth: 2,
      viewBox: "0 0 24 24"
    };

    switch (type) {
      case 'clock':
        return (
          <svg {...iconProps} xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        );
      case 'users':
        return (
          <svg {...iconProps} xmlns="http://www.w3.org/2000/svg">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        );
      case 'check-square':
        return (
          <svg {...iconProps} xmlns="http://www.w3.org/2000/svg">
            <polyline points="9 11 12 14 22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
        );
      case 'dollar-sign':
        return (
          <svg {...iconProps} xmlns="http://www.w3.org/2000/svg">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="pb-6">
      <div className="flex justify-between items-center mb-8">
        <motion.h1 
          initial={{ opacity: 0, x: -15 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="text-2xl font-bold" 
          style={{ color: colors.text }}
        >
          Recruitment Analysis
        </motion.h1>
        <motion.div 
          initial={{ opacity: 0, x: 15 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <Badge variant="primary" className="px-3 py-1.5">Last 30 Days</Badge>
        </motion.div>
      </div>

      {/* Key Metrics */}
      <motion.div 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {metrics.map((metric) => (
          <motion.div
            key={metric.title}
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
                  {metric.title}
                </p>
                <p className="text-2xl font-bold mt-1" style={{ color: colors.text }}>
                  {metric.value}
                </p>
                <div
                  className={`mt-2 text-sm flex items-center font-medium ${
                    metric.isPositive
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {metric.isPositive ? (
                    <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  )}
                  {metric.change}
                </div>
                <p className="text-xs mt-1 opacity-60" style={{ color: colors.text }}>
                  {metric.description}
                </p>
              </div>
              <div 
                className="p-3 rounded-full transition-colors duration-200"
                style={{ 
                  backgroundColor: `${colors.primary}15`,
                  color: metric.color 
                }}
              >
                {getMetricIcon(metric.icon, metric.color)}
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Hiring Performance Analysis Section */}
      <motion.div 
        className="mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <Card className="h-full">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div 
                className="p-2 rounded-lg"
                style={{ backgroundColor: `${colors.primary}15` }}
              >
                <svg className="w-6 h-6" fill="none" stroke={colors.primary} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold" style={{ color: colors.text }}>
                  Hiring Performance Analysis
                </h2>
                <p className="text-sm" style={{ color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
                  Comprehensive recruitment effectiveness metrics
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="primary" className="px-3 py-1">Q2 2024</Badge>
              <button 
                className="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
                style={{ 
                  backgroundColor: `${colors.primary}10`,
                  color: colors.primary,
                  border: `1px solid ${colors.primary}30`
                }}
              >
                Export Report
              </button>
            </div>
          </div>

          {/* Performance Overview Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              {
                title: 'Total Hires',
                value: '127',
                change: '+23%',
                isPositive: true,
                subtitle: 'vs Q1 2024',
                icon: 'user-plus'
              },
              {
                title: 'Avg. Time to Fill',
                value: '28.5',
                unit: 'days',
                change: '-12%',
                isPositive: true,
                subtitle: 'Industry avg: 36 days',
                icon: 'clock'
              },
              {
                title: 'Fill Rate',
                value: '89%',
                change: '+7%',
                isPositive: true,
                subtitle: 'Open positions filled',
                icon: 'target'
              },
              {
                title: 'Quality Score',
                value: '4.2',
                unit: '/5.0',
                change: '+0.3',
                isPositive: true,
                subtitle: 'Hiring manager rating',
                icon: 'star'
              }
            ].map((metric, index) => (
              <motion.div
                key={metric.title}
                className="p-4 rounded-xl border"
                style={{ 
                  backgroundColor: colors.card,
                  borderColor: theme === 'light' ? '#F3F4F6' : '#4B5563'
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + (index * 0.1) }}
                whileHover={{ y: -2 }}
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold" style={{ color: colors.text }}>
                    {metric.title}
                  </h4>
                  <div 
                    className="p-1.5 rounded-lg"
                    style={{ backgroundColor: `${colors.primary}15` }}
                  >
                    {metric.icon === 'user-plus' && (
                      <svg className="w-4 h-4" fill="none" stroke={colors.primary} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 8v6m3-3h-6" />
                      </svg>
                    )}
                    {metric.icon === 'clock' && (
                      <svg className="w-4 h-4" fill="none" stroke={colors.primary} viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                    )}
                    {metric.icon === 'target' && (
                      <svg className="w-4 h-4" fill="none" stroke={colors.primary} viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" />
                        <circle cx="12" cy="12" r="6" />
                        <circle cx="12" cy="12" r="2" />
                      </svg>
                    )}
                    {metric.icon === 'star' && (
                      <svg className="w-4 h-4" fill="none" stroke={colors.primary} viewBox="0 0 24 24">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    )}
                  </div>
                </div>
                
                <div className="flex items-baseline space-x-1 mb-2">
                  <span className="text-2xl font-bold" style={{ color: colors.text }}>
                    {metric.value}
                  </span>
                  {metric.unit && (
                    <span className="text-sm font-medium" style={{ color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
                      {metric.unit}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <div className={`flex items-center text-xs font-medium ${
                    metric.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {metric.isPositive ? (
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                      </svg>
                    ) : (
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    )}
                    {metric.change}
                  </div>
                  <span className="text-xs" style={{ color: theme === 'light' ? '#9CA3AF' : '#6B7280' }}>
                    {metric.subtitle}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Department Performance Breakdown - Compact */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold mb-3" style={{ color: colors.text }}>
                Department Performance
              </h3>
              <div className="space-y-2">
                {[
                  { dept: 'Engineering', hires: 45, target: 50, efficiency: 90 },
                  { dept: 'Sales', hires: 32, target: 30, efficiency: 107 },
                  { dept: 'Marketing', hires: 18, target: 20, efficiency: 90 },
                  { dept: 'Operations', hires: 22, target: 25, efficiency: 88 }
                ].map((dept, index) => (
                  <motion.div
                    key={dept.dept}
                    className="p-3 rounded-lg border"
                    style={{ 
                      backgroundColor: colors.card,
                      borderColor: theme === 'light' ? '#F3F4F6' : '#4B5563'
                    }}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 + (index * 0.1) }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: colors.primary }}
                        />
                        <h4 className="font-semibold text-sm" style={{ color: colors.text }}>
                          {dept.dept}
                        </h4>
                      </div>
                      <div 
                        className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: `${colors.primary}15`,
                          color: colors.primary
                        }}
                      >
                        {dept.efficiency}%
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3 text-xs mb-2">
                      <div>
                        <p style={{ color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>Hires</p>
                        <p className="font-bold text-sm" style={{ color: colors.text }}>{dept.hires}</p>
                      </div>
                      <div>
                        <p style={{ color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>Target</p>
                        <p className="font-bold text-sm" style={{ color: colors.text }}>{dept.target}</p>
                      </div>
                      <div>
                        <p style={{ color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>Variance</p>
                        <p 
                          className="font-bold text-sm"
                          style={{ color: colors.primary }}
                        >
                          {dept.hires >= dept.target ? '+' : ''}{dept.hires - dept.target}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-2">
                      <div 
                        className="w-full rounded-full h-1.5"
                        style={{ backgroundColor: `${colors.primary}10` }}
                      >
                        <div 
                          className="h-1.5 rounded-full transition-all duration-500"
                          style={{ 
                            width: `${Math.min((dept.hires / dept.target) * 100, 100)}%`,
                            backgroundColor: colors.primary
                          }}
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

                        <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4" style={{ color: colors.text }}>
                Hiring Trends & Insights
              </h3>
              
              {/* Monthly Hiring Volume Chart */}
              <div 
                className="p-4 rounded-lg border"
                style={{ 
                  backgroundColor: colors.card,
                  borderColor: theme === 'light' ? '#F3F4F6' : '#4B5563'
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-sm" style={{ color: colors.text }}>
                    Monthly Hiring Volume
                  </h4>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.primary }}></div>
                    <span className="text-xs" style={{ color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
                      2024 Hires
                    </span>
                  </div>
                </div>
                
                {/* Simple Bar Chart Visualization */}
                <div className="space-y-3">
                  {[
                    { month: 'Jan', hires: 18, target: 20 },
                    { month: 'Feb', hires: 22, target: 20 },
                    { month: 'Mar', hires: 25, target: 22 },
                    { month: 'Apr', hires: 31, target: 25 },
                    { month: 'May', hires: 28, target: 30 },
                    { month: 'Jun', hires: 35, target: 32 }
                  ].map((data, index) => (
                    <motion.div
                      key={data.month}
                      className="flex items-center space-x-3"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.0 + (index * 0.1) }}
                    >
                      <span className="text-xs font-medium w-8" style={{ color: colors.text }}>
                        {data.month}
                      </span>
                      <div className="flex-1 flex items-center space-x-2">
                        <div 
                          className="h-6 rounded transition-all duration-500 flex items-center justify-end pr-2"
                          style={{ 
                            width: `${(data.hires / 40) * 100}%`,
                            minWidth: '20px',
                            backgroundColor: colors.primary
                          }}
                        >
                          <span className="text-xs font-medium text-white">
                            {data.hires}
                          </span>
                        </div>
                        <span className="text-xs" style={{ color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
                          /{data.target}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Hiring Sources Breakdown */}
              <div 
                className="p-4 rounded-lg border"
                style={{ 
                  backgroundColor: colors.card,
                  borderColor: theme === 'light' ? '#F3F4F6' : '#4B5563'
                }}
              >
                <h4 className="font-semibold text-sm mb-4" style={{ color: colors.text }}>
                  Top Hiring Sources
                </h4>
                <div className="space-y-3">
                  {[
                    { source: 'LinkedIn', percentage: 42, hires: 53 },
                    { source: 'Employee Referrals', percentage: 28, hires: 36 },
                    { source: 'Company Website', percentage: 18, hires: 23 },
                    { source: 'Job Boards', percentage: 12, hires: 15 }
                  ].map((source, index) => (
                    <motion.div
                      key={source.source}
                      className="space-y-2"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.3 + (index * 0.1) }}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium" style={{ color: colors.text }}>
                          {source.source}
                        </span>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm" style={{ color: colors.primary }}>
                            {source.percentage}%
                          </span>
                          <span className="text-xs" style={{ color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
                            ({source.hires})
                          </span>
                        </div>
                      </div>
                      <div 
                        className="w-full h-2 rounded-full"
                        style={{ backgroundColor: theme === 'light' ? '#E5E7EB' : '#4B5563' }}
                      >
                        <div 
                          className="h-2 rounded-full transition-all duration-700"
                          style={{ 
                            width: `${source.percentage}%`,
                            backgroundColor: colors.primary
                          }}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              

              
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card title="Recruitment Funnel Analysis" className="h-full">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold" style={{ color: colors.text }}>
                Conversion Rates by Stage
              </h4>
              <div className="text-xs" style={{ color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
                Last 30 days
              </div>
            </div>
            
            <div className="space-y-4">
              {[
                { stage: 'Applications', count: 1250, percentage: 100, color: `${colors.primary}` },
                { stage: 'Screening', count: 425, percentage: 34, color: `${colors.primary}CC` },
                { stage: 'First Interview', count: 180, percentage: 14.4, color: `${colors.primary}99` },
                { stage: 'Final Interview', count: 95, percentage: 7.6, color: `${colors.primary}66` },
                { stage: 'Offer Extended', count: 52, percentage: 4.2, color: `${colors.primary}44` },
                { stage: 'Hired', count: 38, percentage: 3.0, color: `${colors.primary}33` }
              ].map((item, index) => (
                <motion.div
                  key={item.stage}
                  className="space-y-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + (index * 0.1) }}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium" style={{ color: colors.text }}>
                      {item.stage}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold" style={{ color: colors.primary }}>
                        {item.count}
                      </span>
                      <span className="text-xs" style={{ color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
                        ({item.percentage}%)
                      </span>
                    </div>
                  </div>
                  <div 
                    className="w-full h-2 rounded-full"
                    style={{ backgroundColor: `${colors.primary}10` }}
                  >
                    <div 
                      className="h-2 rounded-full transition-all duration-700"
                      style={{ 
                        width: `${item.percentage}%`,
                        backgroundColor: item.color
                      }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
            
            <div 
              className="mt-4 p-3 rounded-lg"
              style={{ backgroundColor: `${colors.primary}08` }}
            >
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke={colors.primary} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <span className="text-sm font-medium" style={{ color: colors.primary }}>
                  Overall conversion rate: 3.0%
                </span>
              </div>
            </div>
          </div>
        </Card>

        <Card title="Recruitment Funnel" className="h-full">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold" style={{ color: colors.text }}>
                Stage Performance
              </h4>
              <div className="text-xs" style={{ color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
                vs Industry Avg
              </div>
            </div>
            
            <div className="space-y-4">
              {[
                { stage: 'Application to Screening', rate: 34, benchmark: 30, status: 'above' },
                { stage: 'Screening to Interview', rate: 42, benchmark: 45, status: 'below' },
                { stage: 'Interview to Final', rate: 53, benchmark: 50, status: 'above' },
                { stage: 'Final to Offer', rate: 55, benchmark: 60, status: 'below' },
                { stage: 'Offer to Hire', rate: 73, benchmark: 75, status: 'below' }
              ].map((item, index) => (
                <motion.div
                  key={item.stage}
                  className="p-3 rounded-lg border"
                  style={{ 
                    backgroundColor: colors.card,
                    borderColor: theme === 'light' ? '#F3F4F6' : '#4B5563'
                  }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + (index * 0.1) }}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium" style={{ color: colors.text }}>
                      {item.stage}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold" style={{ color: colors.primary }}>
                        {item.rate}%
                      </span>
                      <div className={`flex items-center text-xs ${
                        item.status === 'above' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {item.status === 'above' ? (
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                          </svg>
                        ) : (
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                          </svg>
                        )}
                        {item.benchmark}%
                      </div>
                    </div>
                  </div>
                  <div 
                    className="w-full h-1.5 rounded-full"
                    style={{ backgroundColor: `${colors.primary}10` }}
                  >
                    <div 
                      className="h-1.5 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${item.rate}%`,
                        backgroundColor: item.status === 'above' ? colors.primary : `${colors.primary}77`
                      }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
            
            <div 
              className="mt-4 p-3 rounded-lg"
              style={{ backgroundColor: `${colors.primary}08` }}
            >
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke={colors.primary} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium" style={{ color: colors.primary }}>
                  3 stages above industry benchmark
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Additional Detail Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Top Hiring Sources" className="h-full">
          <div className="space-y-4 py-2">
            {[
              { source: 'LinkedIn', percentage: 42, color: colors.primary },
              { source: 'Company Website', percentage: 27, color: `${colors.primary}CC` },
              { source: 'Referrals', percentage: 18, color: `${colors.primary}99` },
              { source: 'Job Boards', percentage: 13, color: `${colors.primary}66` }
            ].map((item, index) => (
              <motion.div
                key={item.source}
                className="space-y-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + (index * 0.1) }}
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium" style={{ color: colors.text }}>
                    {item.source}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold" style={{ color: colors.primary }}>
                      {item.percentage}%
                    </span>
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                  </div>
                </div>
                <div 
                  className="w-full rounded-full h-2"
                  style={{ backgroundColor: `${colors.primary}10` }}
                >
                  <div 
                    className="h-2 rounded-full transition-all duration-700"
                    style={{ 
                      width: `${item.percentage}%`,
                      backgroundColor: item.color
                    }}
                  />
                </div>
              </motion.div>
            ))}
            
            <div 
              className="mt-4 p-3 rounded-lg"
              style={{ backgroundColor: `${colors.primary}08` }}
            >
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke={colors.primary} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-sm font-medium" style={{ color: colors.primary }}>
                  LinkedIn leads with 42% of hires
                </span>
              </div>
            </div>
          </div>
        </Card>

        <Card title="Time to Hire by Position" className="h-full">
          <div className="space-y-4 py-2">
            {[
              { position: 'Software Engineer', days: 38, percentage: 75, trend: 'stable', color: colors.primary },
              { position: 'Product Manager', days: 45, percentage: 90, trend: 'up', color: `${colors.primary}CC` },
              { position: 'UI/UX Designer', days: 32, percentage: 65, trend: 'down', color: `${colors.primary}99` },
              { position: 'Sales Representative', days: 21, percentage: 42, trend: 'down', color: `${colors.primary}66` }
            ].map((item, index) => (
              <motion.div
                key={item.position}
                className="space-y-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + (index * 0.1) }}
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium" style={{ color: colors.text }}>
                    {item.position}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold" style={{ color: colors.primary }}>
                      {item.days} days
                    </span>
                    <div className={`flex items-center text-xs ${
                      item.trend === 'down' ? 'text-emerald-600 dark:text-emerald-400' :
                      item.trend === 'up' ? 'text-red-600 dark:text-red-400' :
                      'text-gray-600 dark:text-gray-400'
                    }`}>
                      {item.trend === 'down' && (
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                      )}
                      {item.trend === 'up' && (
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                      )}
                      {item.trend === 'stable' && (
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
                <div 
                  className="w-full rounded-full h-2"
                  style={{ backgroundColor: `${colors.primary}10` }}
                >
                  <div 
                    className="h-2 rounded-full transition-all duration-700"
                    style={{ 
                      width: `${item.percentage}%`,
                      backgroundColor: item.color
                    }}
                  />
                </div>
              </motion.div>
            ))}
            
            <div 
              className="mt-4 p-3 rounded-lg"
              style={{ backgroundColor: `${colors.primary}08` }}
            >
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke={colors.primary} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium" style={{ color: colors.primary }}>
                  Average: 34 days across all positions
                </span>
              </div>
            </div>
          </div>
        </Card>

        <Card title="Upcoming Reports" className="h-full">
          <div className="space-y-3 py-2">
            {[
              { title: 'Monthly Hiring Summary', date: 'June 1, 2023' },
              { title: 'Recruitment Cost Analysis', date: 'June 5, 2023' },
              { title: 'Candidate Source ROI', date: 'June 10, 2023' },
              { title: 'Quarterly Performance Review', date: 'June 15, 2023' }
            ].map((report, index) => (
              <div 
                key={index}
                className="p-3 rounded-md border border-dashed flex items-start justify-between"
                style={{ borderColor: colors.border }}
              >
                <div>
                  <p className="text-sm font-medium" style={{ color: colors.text }}>{report.title}</p>
                  <p className="text-xs mt-1" style={{ color: `${colors.text}80` }}>{report.date}</p>
                </div>
                <svg 
                  className="w-5 h-5 flex-shrink-0" 
                  fill="none" 
                  stroke={colors.primary} 
                  viewBox="0 0 24 24" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AnalysisPage;
