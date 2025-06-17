// src/components/ai-assistant/ChatHeader.tsx
import React from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { Candidate, Company } from '@/types';
import Button from '@/components/ui/Button';
import { FiCpu, FiSettings } from 'react-icons/fi';
import EntityContextBadge from './EntityContextBadge';

interface ChatHeaderProps {
  selectedEntity: Candidate | Company | null;
  onClearEntity: () => void;
  onOpenSettings: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ 
  selectedEntity, 
  onClearEntity,
  onOpenSettings 
}) => {
  const { colors, theme } = useTheme();

  return (
    <div className="px-6 py-4 border-b flex items-center justify-between sticky top-0 z-20" style={{
      backgroundColor: theme === 'light' ? '#FFFFFF' : '#1E293B',
      borderColor: theme === 'light' ? '#E2E8F0' : '#334155',
      boxShadow: theme === 'light' ? '0 1px 3px rgba(0, 0, 0, 0.05)' : '0 1px 3px rgba(0, 0, 0, 0.2)'
    }}>
      <div className="flex items-center">
        <div className="mr-3 h-10 w-10 rounded-xl flex items-center justify-center" 
          style={{ 
            background: `linear-gradient(135deg, ${colors.primary}, ${colors.primary}dd)`,
          }}
        >
          <FiCpu className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: colors.text }}>AI Assistant</h1>
          <p className="text-xs opacity-60 mt-0.5" style={{ color: colors.text }}>
            {selectedEntity 
              ? `Context: ${'firstName' in selectedEntity ? 'Candidate' : 'Company'} mode` 
              : 'Ready to help with recruitment tasks'
            }
          </p>
        </div>
      </div>
      {selectedEntity ? (
        <EntityContextBadge 
          entity={selectedEntity} 
          onClear={onClearEntity} 
        />
      ) : (
        <Button
          variant="outline"
          onClick={onOpenSettings}
          className="text-sm"
          leftIcon={<FiSettings />}
        >
          AI Settings
        </Button>
      )}
    </div>
  );
};

export default ChatHeader;