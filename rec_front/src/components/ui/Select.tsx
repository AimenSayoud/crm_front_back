// src/components/ui/Select.tsx
import React, { forwardRef } from 'react';
import { useTheme } from '@/app/context/ThemeContext';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[];
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      options,
      label,
      error,
      helperText,
      fullWidth = false,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const { colors } = useTheme();
    const selectId = id || `select-${Math.random().toString(36).substring(2, 9)}`;

    return (
      <div className={`${fullWidth ? 'w-full' : ''} mb-4`}>
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium mb-1"
            style={{ color: colors.text }}
          >
            {label}
          </label>
        )}
        
        <div className="relative">
          <select
            id={selectId}
            ref={ref}
            className={`
              w-full rounded-md shadow-sm focus:outline-none focus:ring-2 appearance-none pr-10 pl-3 py-2 text-sm transition-colors duration-200
              ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}
              ${className}
            `}
            style={{
              backgroundColor: colors.background,
              color: colors.text,
              borderColor: error ? '#EF4444' : colors.border,
            }}
            {...props}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          
          <div
            className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2"
            style={{ color: colors.text }}
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </div>
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

Select.displayName = 'Select';

export default Select;