import React from 'react';
import { FiLoader } from 'react-icons/fi';
import { useTheme } from '@/app/context/ThemeContext';

interface LoadingStateProps {
  entityType: 'candidate' | 'company';
  isCompact?: boolean;
}

const LoadingState: React.FC<LoadingStateProps> = ({ entityType, isCompact = false }) => {
  const { colors } = useTheme();
  
  return (
    <div 
      className={`px-4 ${isCompact ? 'py-4' : 'py-8'} text-center flex flex-col items-center justify-center`} 
      style={{ color: `${colors.text}99` }}
    >
      <FiLoader 
        className={`${isCompact ? 'w-6 h-6 mb-2' : 'w-8 h-8 mb-3'} animate-spin`} 
        style={{ color: colors.primary }} 
      />
      <p className="font-medium">
        Loading {entityType === 'candidate' ? 'candidates' : 'companies'}...
      </p>
    </div>
  );
};

export default LoadingState;
