import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/app/context/ThemeContext';

interface CharacterCounterProps {
  value: string;
  className?: string;
}

const CharacterCounter: React.FC<CharacterCounterProps> = ({ 
  value, 
  className = "absolute right-3 -bottom-8 text-xs font-medium" 
}) => {
  const { colors, theme } = useTheme();
  const isLightTheme = theme === "light";

  if (value.length === 0) return null;

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 0.7, y: 0 }}
      exit={{ opacity: 0, y: 5 }}
      transition={{ duration: 0.2 }}
      style={{ color: colors.text }}
    >
      <span 
        className="px-2 py-1 rounded-full text-xs"
        style={{ 
          background: isLightTheme ? "#f1f5f9" : "#334155",
          border: `1px solid ${isLightTheme ? "#e2e8f0" : "#475569"}`
        }}
      >
        {value.length} {value.length === 1 ? "char" : "chars"}
      </span>
    </motion.div>
  );
};

export default CharacterCounter; 