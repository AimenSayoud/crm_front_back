// src/components/ui/Input.tsx
import React, { forwardRef } from 'react';
import { useTheme } from '@/app/context/ThemeContext';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const { colors } = useTheme();
    const inputId = id || `input-${Math.random().toString(36).substring(2, 9)}`;

    return (
      <div className={`${fullWidth ? 'w-full' : ''} mb-4`}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium mb-1"
            style={{ color: colors.text }}
          >
            {label}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div 
              className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none"
              style={{ color: `${colors.text}99` }}
            >
              {leftIcon}
            </div>
          )}
          
          <input
            id={inputId}
            ref={ref}
            className={`
              w-full rounded-md shadow-sm focus:outline-none focus:ring-2 transition-colors duration-200
              ${leftIcon ? 'pl-10' : 'pl-3'} 
              ${rightIcon ? 'pr-10' : 'pr-3'} 
              py-2 text-sm
              ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}
              ${className}
            `}
            style={{
              backgroundColor: colors.background,
              color: colors.text,
              borderColor: error ? '#EF4444' : colors.border,
            }}
            {...props}
          />
          
          {rightIcon && (
            <div 
              className="absolute inset-y-0 right-0 flex items-center pr-3"
              style={{ color: `${colors.text}99` }}
            >
              {rightIcon}
            </div>
          )}
        </div>
        
        {(error || helperText) && (
          <p 
            className={`mt-1 text-xs ${error ? 'text-red-500' : ''}`}
            style={{ color: error ? '#EF4444' : `${colors.text}99` }}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;