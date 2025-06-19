// src/components/ai-assistant/CommandMenu/EntityItem.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Candidate, Company } from '@/types';
import { useTheme } from '@/app/context/ThemeContext';

interface EntityItemProps {
  entity: Candidate | Company;
  entityType: 'candidate' | 'company';
  isSelected: boolean;
  onClick: () => void;
}

const EntityItem: React.FC<EntityItemProps> = ({ entity, entityType, isSelected, onClick }) => {
  const { colors, theme } = useTheme();
  
  const isCandidate = entityType === 'candidate';
  const candidate = isCandidate ? (entity as Candidate) : null;
  const company = !isCandidate ? (entity as Company) : null;
  
  return (
    <motion.div
      className={`px-4 py-3 flex items-center cursor-pointer rounded-lg mx-2 my-1 transition-colors duration-150`}
      style={{
        backgroundColor: isSelected 
          ? (theme === 'light' ? `${colors.primary}1A` : `${colors.primary}33`) 
          : 'transparent',
        color: isSelected ? colors.primary : colors.text,
      }}
      whileHover={{ backgroundColor: theme === 'light' ? `${colors.primary}10` : `${colors.primary}26` }}
      onClick={onClick}
      role="option"
      aria-selected={isSelected}
    >
      <div
        className={`w-10 h-10 flex items-center justify-center mr-3 flex-shrink-0 text-white font-medium ${
          entityType === 'candidate' ? 'rounded-full' : 'rounded-md'
        }`}
        style={{ 
          backgroundColor: entityType === 'candidate' ? colors.primary : colors.secondary 
        }}
      >
        {isCandidate
          ? `${candidate?.firstName?.[0]}${candidate?.lastName?.[0]}`
          : company?.name?.[0]}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm">
          {isCandidate
            ? `${candidate?.firstName} ${candidate?.lastName}`
            : company?.name}
        </div>
        <div className="text-xs opacity-70 truncate">
          {isCandidate
            ? `${candidate?.position || 'No position'} · ${candidate?.email || 'No email'}`
            : `${company?.industry || 'No industry'} · ${company?.contactPerson || 'No contact'}`}
        </div>
      </div>
    </motion.div>
  );
};

export default EntityItem;

