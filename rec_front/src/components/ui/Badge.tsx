// src/components/ui/Badge.tsx
import React from 'react';
import { useTheme } from '@/app/context/ThemeContext';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  style?: React.CSSProperties;
}

// Make sure BadgeVariant includes 'custom'
type BadgeVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'custom';

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  className = '',
}) => {
  const { theme } = useTheme();
  
  const getVariantStyles = () => {
    const isDark = theme === 'dark';
    
    switch (variant) {
      case 'primary':
        return {
          bg: isDark ? '#3B82F6' : '#EFF6FF', // blue-500 or blue-50
          text: isDark ? 'white' : '#2563EB', // white or blue-600
        };
      case 'secondary':
        return {
          bg: isDark ? '#8B5CF6' : '#F5F3FF', // violet-500 or violet-50
          text: isDark ? 'white' : '#6D28D9', // white or violet-600
        };
      case 'success':
        return {
          bg: isDark ? '#10B981' : '#ECFDF5', // emerald-500 or emerald-50
          text: isDark ? 'white' : '#059669', // white or emerald-600
        };
      case 'warning':
        return {
          bg: isDark ? '#F59E0B' : '#FFFBEB', // amber-500 or amber-50
          text: isDark ? 'white' : '#D97706', // white or amber-600
        };
      case 'danger':
        return {
          bg: isDark ? '#EF4444' : '#FEF2F2', // red-500 or red-50
          text: isDark ? 'white' : '#DC2626', // white or red-600
        };
      case 'info':
        return {
          bg: isDark ? '#0EA5E9' : '#EFF6FF', // sky-500 or blue-50
          text: isDark ? 'white' : '#0284C7', // white or sky-600
        };
      default:
        return {
          bg: isDark ? '#4B5563' : '#F3F4F6', // gray-600 or gray-100
          text: isDark ? 'white' : '#374151', // white or gray-700
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}
      style={{
        backgroundColor: styles.bg,
        color: styles.text,
      }}
    >
      {children}
    </span>
  );
};

export default Badge;