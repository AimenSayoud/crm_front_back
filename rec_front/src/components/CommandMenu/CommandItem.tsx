// src/components/ai-assistant/CommandMenu/CommandItem.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Command } from './types';
import { useTheme } from '@/app/context/ThemeContext';

interface CommandItemProps {
  command: Command;
  isSelected: boolean;
  onClick: () => void;
}

const CommandItem: React.FC<CommandItemProps> = ({ command, isSelected, onClick }) => {
  const { colors, theme } = useTheme();
  
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
      role="menuitem"
      aria-selected={isSelected}
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center mr-3 flex-shrink-0"
        style={{
          backgroundColor: isSelected ? `${colors.primary}2A` : `${colors.primary}15`,
          color: colors.primary,
        }}
      >
        {command.icon}
      </div>
      <div>
        <div className="font-medium text-sm">{command.label}</div>
        <div className="text-xs opacity-70">{command.description}</div>
      </div>
    </motion.div>
  );
};

export default CommandItem;

