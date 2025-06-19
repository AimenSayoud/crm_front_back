import React from 'react';
import { motion } from 'framer-motion';
import { Candidate, Company } from '@/types';
import { useTheme } from '@/app/context/ThemeContext';
import { FiUser, FiBriefcase, FiX } from 'react-icons/fi';

interface EntityContextBadgeProps {
  entity: Candidate | Company;
  onClear: () => void;
}

const EntityContextBadge: React.FC<EntityContextBadgeProps> = ({ entity, onClear }) => {
  const { colors } = useTheme();
  const isCandidate = 'firstName' in entity;
  
  const entityName = isCandidate 
    ? `${entity.firstName} ${entity.lastName}` 
    : entity.name;
    
  const entityRole = isCandidate 
    ? entity.position || 'Candidate' 
    : entity.industry || 'Company';
    
  const entityColor = isCandidate ? colors.primary : colors.secondary;
  const EntityIcon = isCandidate ? FiUser : FiBriefcase;

  return (
    <motion.div 
      className="flex items-center px-3 py-2 rounded-lg border"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      style={{ 
        borderColor: `${entityColor}40`,
        backgroundColor: `${entityColor}10`,
      }}
    >
      <div className="w-8 h-8 rounded-lg flex items-center justify-center mr-2"
        style={{ backgroundColor: `${entityColor}20` }}
      >
        <EntityIcon className="w-4 h-4" style={{ color: entityColor }} />
      </div>
      <div className="mr-3">
        <div className="font-medium text-sm" style={{ color: entityColor }}>
          {entityName}
        </div>
        <div className="text-xs opacity-70" style={{ color: entityColor }}>
          {entityRole}
        </div>
      </div>
      <button 
        className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10"
        onClick={onClear}
        aria-label="Clear context"
      >
        <FiX className="w-3.5 h-3.5" style={{ color: entityColor }} />
      </button>
    </motion.div>
  );
};

export default EntityContextBadge;