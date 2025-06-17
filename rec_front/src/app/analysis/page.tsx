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
      color: theme === 'light' ? '#3B82F6' : '#60A5FA', // Blue
    },
    { 
      title: 'Candidate Conversion',
      value: '24%',
      change: '+2%',
      isPositive: true,
      description: 'Applications to interview ratio',
      icon: 'users',
      color: theme === 'light' ? '#10B981' : '#34D399', // Green
    },
    { 
      title: 'Offer Acceptance',
      value: '91%',
      change: '+1%',
      isPositive: true,
      description: 'Offers accepted by candidates',
      icon: 'check-square',
      color: theme === 'light' ? '#8B5CF6' : '#A78BFA', // Purple
    },
    { 
      title: 'Cost per Hire',
      value: '$4,250',
      change: '-8%',
      isPositive: true,
      description: 'Average cost per successful hire',
      icon: 'dollar-sign',
      color: theme === 'light' ? '#F59E0B' : '#FBBF24', // Amber
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
                className="p-3 rounded-full bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm border border-white/60 dark:border-gray-700/30"
                style={{ color: metric.color }}
              >
                {getMetricIcon(metric.icon, metric.color)}
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card title="Hiring Performance" className="h-full">
          <div className="h-80 flex items-center justify-center">
            <div className="text-center">
              <svg
                className="w-12 h-12 mx-auto mb-4"
                fill="none"
                stroke={colors.primary}
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 13v-1m4 1v-3m4 3V8M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                />
              </svg>
              <p className="text-lg font-medium" style={{ color: colors.text }}>
                Performance Charts
              </p>
              <p className="text-sm mt-2 max-w-md mx-auto" style={{ color: `${colors.text}99` }}>
                Visualized recruitment metrics and KPIs would appear here in a production environment.
              </p>
            </div>
          </div>
        </Card>

        <Card title="Recruitment Funnel" className="h-full">
          <div className="h-80 flex items-center justify-center">
            <div className="text-center">
              <svg
                className="w-12 h-12 mx-auto mb-4"
                fill="none"
                stroke={colors.primary}
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              <p className="text-lg font-medium" style={{ color: colors.text }}>
                Recruitment Funnel
              </p>
              <p className="text-sm mt-2 max-w-md mx-auto" style={{ color: `${colors.text}99` }}>
                Visualization of recruitment funnel stages from application to hire would appear here.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Additional Detail Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Top Hiring Sources" className="h-full">
          <div className="space-y-4 py-2">
            <div className="flex justify-between items-center">
              <span className="text-sm" style={{ color: colors.text }}>LinkedIn</span>
              <span className="text-sm font-medium" style={{ color: colors.text }}>42%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '42%' }}></div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm" style={{ color: colors.text }}>Company Website</span>
              <span className="text-sm font-medium" style={{ color: colors.text }}>27%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div className="bg-green-600 h-2.5 rounded-full" style={{ width: '27%' }}></div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm" style={{ color: colors.text }}>Referrals</span>
              <span className="text-sm font-medium" style={{ color: colors.text }}>18%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: '18%' }}></div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm" style={{ color: colors.text }}>Job Boards</span>
              <span className="text-sm font-medium" style={{ color: colors.text }}>13%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div className="bg-yellow-600 h-2.5 rounded-full" style={{ width: '13%' }}></div>
            </div>
          </div>
        </Card>

        <Card title="Time to Hire by Position" className="h-full">
          <div className="space-y-4 py-2">
            <div className="flex justify-between items-center">
              <span className="text-sm" style={{ color: colors.text }}>Software Engineer</span>
              <span className="text-sm font-medium" style={{ color: colors.text }}>38 days</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '75%' }}></div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm" style={{ color: colors.text }}>Product Manager</span>
              <span className="text-sm font-medium" style={{ color: colors.text }}>45 days</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div className="bg-green-600 h-2.5 rounded-full" style={{ width: '90%' }}></div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm" style={{ color: colors.text }}>UI/UX Designer</span>
              <span className="text-sm font-medium" style={{ color: colors.text }}>32 days</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: '65%' }}></div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm" style={{ color: colors.text }}>Sales Representative</span>
              <span className="text-sm font-medium" style={{ color: colors.text }}>21 days</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div className="bg-yellow-600 h-2.5 rounded-full" style={{ width: '42%' }}></div>
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
