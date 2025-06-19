// src/components/ai-assistant/CommandMenu/ErrorState.tsx
import React from 'react';
import { FiAlertCircle } from 'react-icons/fi';
import { useTheme } from '@/app/context/ThemeContext';

interface ErrorStateProps {
  error: string;
  isCompact?: boolean;
}

const ErrorState: React.FC<ErrorStateProps> = ({ error, isCompact = false }) => {
  const { colors } = useTheme();
  
  return (
    <div 
      className={`px-4 ${isCompact ? 'py-4' : 'py-8'} text-center flex flex-col items-center justify-center`} 
      style={{ color: colors.text }}
    >
      <FiAlertCircle className={`${isCompact ? 'w-8 h-8 mb-2' : 'w-10 h-10 mb-3'} text-red-500`} />
      <p className="font-medium text-red-600 dark:text-red-400">Error loading data</p>
      <p className="text-sm opacity-70 mt-1">{error}</p>
    </div>
  );
};

export default ErrorState;

