// src/components/ui/ModernEntityCard.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/app/context/ThemeContext';
import Badge from '@/components/ui/Badge';
import { Candidate, Company } from '@/types';

interface ModernEntityCardProps {
  entity: Candidate | Company;
  onClear: () => void;
}

const ModernEntityCard: React.FC<ModernEntityCardProps> = ({
  entity,
  onClear
}) => {
  const { colors, theme } = useTheme();
  const isCandidate = 'firstName' in entity;

  // Get card style based on entity type and theme
  const getCardStyle = () => {
    return {
      background: isCandidate ? `${colors.primary}15` : `${colors.secondary}15`,
      border: `1px solid ${isCandidate ? colors.primary : colors.secondary}30`
    };
  };

  return (
    <motion.div
      className="flex items-center gap-3 px-3 py-2 rounded-lg"
      style={getCardStyle()}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      {/* Entity icon/avatar */}
      <div
        className={`w-9 h-9 ${isCandidate ? 'rounded-full' : 'rounded-md'} flex items-center justify-center text-white font-medium text-sm`}
        style={{
          backgroundColor: isCandidate ? colors.primary : colors.secondary
        }}
      >
        {isCandidate
          ? `${(entity as Candidate).firstName?.charAt(0) || ''}${(entity as Candidate).lastName?.charAt(0) || ''}`
          : ((entity as Company).name?.charAt(0) || 'C')}
      </div>

      {/* Entity details */}
      <div className="flex flex-col">
        <span className="font-medium text-sm" style={{ color: colors.text }}>
          {isCandidate
            ? `${(entity as Candidate).firstName || 'Unknown'} ${(entity as Candidate).lastName || 'Candidate'}`
            : ((entity as Company).name || 'Unknown Company')}
        </span>

        <div className="flex items-center gap-2 text-xs">
          {/* Entity metadata */}
          <span style={{ color: `${colors.text}80` }}>
            {isCandidate
              ? (entity as Candidate).position || 'No Position'
              : (entity as Company).industry || 'No Industry'}
          </span>

          {/* Status badge for candidates */}
          {isCandidate && (entity as Candidate).status && (
            <Badge
              variant={
                (entity as Candidate).status === 'hired' ? 'success' :
                (entity as Candidate).status === 'rejected' ? 'danger' :
                (entity as Candidate).status === 'offer' ? 'warning' :
                'primary'
              }
              className="text-xs py-0.5 px-1.5"
            >
              {(entity as Candidate).status}
            </Badge>
          )}

          {/* Company open positions */}
          {!isCandidate && (entity as Company).openPositions && (
            <span
              className="px-1.5 py-0.5 rounded text-[10px] font-medium"
              style={{
                backgroundColor: `${colors.primary}15`,
                color: colors.primary
              }}
            >
              {(entity as Company).openPositions} position{(entity as Company).openPositions !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Clear button */}
      <button
        className="ml-auto p-1 rounded-full transition-colors"
        onClick={onClear}
        title="Clear selection"
        style={{
          color: `${colors.text}60`,
          hover: { color: colors.text }
        }}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </motion.div>
  );
};

export default ModernEntityCard;