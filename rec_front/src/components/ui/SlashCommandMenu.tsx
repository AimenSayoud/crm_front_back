// src/components/ui/SlashCommandMenu.tsx
import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/app/context/ThemeContext';

interface Command {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
}

interface SlashCommandMenuProps {
  isOpen: boolean;
  commands: Command[];
  selectedIndex: number;
  onSelect: (command: Command) => void;
  onClose: () => void;
}

const SlashCommandMenu: React.FC<SlashCommandMenuProps> = ({
  isOpen,
  commands,
  selectedIndex,
  onSelect,
  onClose,
}) => {
  const { colors, theme } = useTheme();
  const menuRef = useRef<HTMLDivElement>(null);

  // Handle outside clicks
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Don't render if not open or no commands
  if (!isOpen || commands.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        className="absolute bottom-full left-4 mb-2 w-64 shadow-lg rounded-md overflow-hidden z-10"
        style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}` }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.15 }}
      >
        <div className="p-2 border-b" style={{ borderColor: colors.border }}>
          <p className="text-xs" style={{ color: `${colors.text}80` }}>
            Commands
          </p>
        </div>
        <div className="py-1 max-h-60 overflow-y-auto">
          {commands.map((command, index) => (
            <motion.div
              key={command.id}
              className={`px-3 py-2 flex items-center cursor-pointer ${
                index === selectedIndex ? theme === 'light' ? 'bg-gray-100' : 'bg-gray-700' : ''
              }`}
              style={{ 
                backgroundColor: index === selectedIndex 
                  ? theme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)' 
                  : 'transparent' 
              }}
              whileHover={{
                backgroundColor: theme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'
              }}
              onClick={() => onSelect(command)}
            >
              <div 
                className="w-8 h-8 rounded-md flex items-center justify-center mr-2 flex-shrink-0"
                style={{ 
                  backgroundColor: `${colors.primary}15`, 
                  color: colors.primary 
                }}
              >
                {command.icon}
              </div>
              <div>
                <div className="font-medium text-sm" style={{ color: colors.text }}>
                  {command.label}
                </div>
                <div className="text-xs" style={{ color: `${colors.text}80` }}>
                  {command.description}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SlashCommandMenu;