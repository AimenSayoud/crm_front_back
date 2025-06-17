
// src/components/ai-assistant/CommandMenu/EmptyState.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { FiSearch, FiUsers, FiBriefcase } from 'react-icons/fi';
import { useTheme } from '@/app/context/ThemeContext';

interface EmptyStateProps {
  type: 'candidate' | 'company';
  searchTerm?: string;
  isCompact?: boolean;
}

const EmptyState: React.FC<EmptyStateProps> = ({ type, searchTerm, isCompact = false }) => {
  const { colors } = useTheme();
  
  const Icon = searchTerm 
    ? FiSearch 
    : type === 'candidate' ? FiUsers : FiBriefcase;
    
  const title = searchTerm
    ? `No ${type} found for "${searchTerm}"`
    : `No ${type}s available`;
    
  const subtitle = searchTerm
    ? 'Try a different search.'
    : `There are no ${type}s to display.`;
    
  return (
    <div className={`px-4 ${isCompact ? 'py-4' : 'py-8'} text-center`} style={{ color: `${colors.text}99` }}>
      <motion.div 
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.1 }}
      >
        <Icon className={`${isCompact ? 'w-8 h-8' : 'w-12 h-12'} mx-auto mb-3 opacity-30`} />
        <p className="font-medium">{title}</p>
        <p className="text-sm opacity-70">{subtitle}</p>
      </motion.div>
    </div>
  );
};

export default EmptyState;

// src/components/ai-assistant/CommandMenu/LoadingState.tsx

