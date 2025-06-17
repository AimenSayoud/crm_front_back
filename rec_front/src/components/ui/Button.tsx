// src/components/ui/Button.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/app/context/ThemeContext';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success' | 'ghost';
  size?: 'xs'| 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  className?: string;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  children,
  className = '',
  disabled,
  onClick,
  ...rest
}) => {
  const { colors, theme } = useTheme();

  const getButtonStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: colors.primary,
          color: 'white',
          hoverBg: theme === 'light' ? '#2563EB' : '#3B82F6', // darker/lighter blue
          borderColor: 'transparent',
        };
      case 'secondary':
        return {
          backgroundColor: colors.secondary,
          color: 'white',
          hoverBg: theme === 'light' ? '#0E9F6E' : '#10B981', // darker/lighter green
          borderColor: 'transparent',
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          color: colors.primary,
          hoverBg: theme === 'light' ? '#EFF6FF' : '#1E40AF', // light blue / darker blue for better contrast
          borderColor: colors.primary,
        };
      case 'danger':
        return {
          backgroundColor: '#EF4444', // red-500
          color: 'white',
          hoverBg: '#DC2626', // red-600
          borderColor: 'transparent',
        };
      case 'success':
        return {
          backgroundColor: '#10B981', // emerald-500
          color: 'white',
          hoverBg: '#059669', // emerald-600
          borderColor: 'transparent',
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          color: colors.text,
          hoverBg: theme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.1)',
          borderColor: 'transparent',
        };
      default:
        return {
          backgroundColor: colors.primary,
          color: 'white',
          hoverBg: theme === 'light' ? '#2563EB' : '#3B82F6',
          borderColor: 'transparent',
        };
    }
  };

  const styles = getButtonStyles();

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
    xs: 'px-2 py-1 text-xs',
  };

  const buttonClasses = `
    rounded-md font-medium transition-all flex items-center justify-center
    ${sizeClasses[size]}
    ${fullWidth ? 'w-full' : ''}
    ${disabled || isLoading ? 'opacity-60 cursor-not-allowed' : ''}
    ${className}
  `;

  // Animation states
  const hoverAnimation = !(disabled || isLoading) ? { 
    scale: 1.03, 
    backgroundColor: styles.hoverBg,
    transition: { duration: 0.2 } 
  } : {};

  const tapAnimation = !(disabled || isLoading) ? { 
    scale: 0.97,
    transition: { duration: 0.1 } 
  } : {};

  
  return (
    <motion.button
      className={buttonClasses}
      style={{
        backgroundColor: styles.backgroundColor,
        color: styles.color,
        border: `1px solid ${styles.borderColor}`,
        boxShadow: variant === 'outline' ? `0 0 0 1px ${styles.borderColor}` : undefined,
      }}
      disabled={disabled || isLoading}
      whileHover={hoverAnimation}
      whileTap={tapAnimation}
      initial={{ opacity: 0.9 }}
      animate={{ opacity: 1 }}
      onClick={onClick}
      {...rest}
      // Type assertion to fix type conflict with motion.button
    >
      {isLoading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      )}
      {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
      {children}
      {rightIcon && <span className="ml-2">{rightIcon}</span>}
    </motion.button>
  );
};

export default Button;