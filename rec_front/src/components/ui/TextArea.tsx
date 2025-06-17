// src/components/ui/TextArea.tsx
import React, { forwardRef } from 'react';
import { useTheme } from '@/app/context/ThemeContext';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  maxRows?: number; // Custom prop that won't be passed directly to textarea
}

const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (
    {
      label,
      error,
      helperText,
      fullWidth = false,
      className = '',
      id,
      rows = 4,
      maxRows,
      ...props
    },
    ref
  ) => {
    const { colors } = useTheme();
    const textAreaId = id || `textarea-${Math.random().toString(36).substring(2, 9)}`;

    return (
      <div className={`${fullWidth ? 'w-full' : ''} mb-4`}>
        {label && (
          <label
            htmlFor={textAreaId}
            className="block text-sm font-medium mb-1"
            style={{ color: colors.text }}
          >
            {label}
          </label>
        )}
        
        <textarea
          id={textAreaId}
          ref={ref}
          rows={rows}
          className={`
            w-full rounded-md shadow-sm focus:outline-none focus:ring-2 px-3 py-2 text-sm transition-colors duration-200
            ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}
            ${className}
          `}
          style={{
            backgroundColor: colors.background,
            color: colors.text,
            borderColor: error ? '#EF4444' : colors.border,
          }}
          data-max-rows={maxRows}
          {...props}
        />
        
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

TextArea.displayName = 'TextArea';

export default TextArea;