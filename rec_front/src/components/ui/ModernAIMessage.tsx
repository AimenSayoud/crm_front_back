// src/components/ui/ModernAIMessage.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/app/context/ThemeContext';

interface EntityReference {
  type: 'candidate' | 'company';
  id: string;
  name: string;
}

interface MessageProps {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  isLoading?: boolean;
  entityReference?: EntityReference;
  isLast?: boolean;
}

const ModernAIMessage: React.FC<MessageProps> = ({
  content,
  sender,
  timestamp,
  isLoading,
  entityReference,
  isLast = false
}) => {
  const { colors, theme } = useTheme();

  // Format time
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get message style based on sender and theme
  const getMessageStyle = () => {
    if (sender === 'user') {
      return {
        background: colors.primary,
        color: '#FFFFFF',
        border: isLast ? `1px solid ${colors.primary}90` : 'none',
        boxShadow: `0 2px 4px -1px ${colors.primary}30`
      };
    } else {
      return {
        background: colors.card,
        color: colors.text,
        border: isLast ? `1px solid ${colors.border}` : 'none',
        boxShadow: `0 2px 4px -1px ${theme === 'light' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(0, 0, 0, 0.15)'}`
      };
    }
  };

  // Get entity tag styles based on entity type and theme
  const getEntityTagStyle = () => {
    const isCandidate = entityReference?.type === 'candidate';

    if (isCandidate) {
      return {
        bg: `${colors.primary}15`,
        text: colors.primary,
        icon: colors.primary
      };
    } else {
      return {
        bg: `${colors.secondary}15`,
        text: colors.secondary,
        icon: colors.secondary
      };
    }
  };

  // Message styles
  const messageStyle = getMessageStyle();

  return (
    <motion.div
      className={`flex max-w-[90%] ${sender === 'user' ? 'ml-auto' : 'mr-auto'}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Entity icon for assistant messages */}
      {entityReference && sender === 'assistant' && (
        <div className="flex flex-col justify-start items-center mr-2 mt-1">
          <div
            className={`w-8 h-8 ${entityReference.type === 'candidate' ? 'rounded-full' : 'rounded-md'} flex items-center justify-center text-white font-medium text-xs shadow-sm`}
            style={{
              backgroundColor: entityReference.type === 'candidate' ? colors.primary : colors.secondary
            }}
            title={`Generated for ${entityReference.name}`}
          >
            {entityReference.type === 'candidate'
              ? entityReference.name.split(' ').map(n => n.charAt(0)).join('')
              : entityReference.name.charAt(0)}
          </div>
        </div>
      )}

      {/* Message bubble */}
      <div
        className={`rounded-xl px-4 py-3 ${isLast ? 'ring-2 ring-opacity-30' : ''}`}
        style={{
          background: messageStyle.background,
          color: messageStyle.color,
          boxShadow: messageStyle.boxShadow,
          borderColor: messageStyle.border,
          ...(isLast && { ringColor: sender === 'user' ? colors.primary : colors.border })
        }}
      >
        {isLoading ? (
          <div className="flex items-center space-x-2 py-1">
            <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        ) : (
          <>
            {/* Message Content */}
            <div className="whitespace-pre-line text-sm leading-relaxed">{content}</div>

            {/* Message Footer */}
            <div
              className="flex items-center justify-between mt-2 pt-1 border-t"
              style={{
                borderColor: sender === 'user'
                  ? 'rgba(255, 255, 255, 0.2)'
                  : colors.border
              }}
            >
              {/* Entity reference tag */}
              {entityReference && (
                <div className="flex items-center text-xs rounded-full px-2 py-0.5 mr-2"
                  style={{
                    backgroundColor: getEntityTagStyle().bg,
                    color: getEntityTagStyle().text
                  }}
                >
                  <span className="mr-1">
                    {entityReference.type === 'candidate' ? (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    ) : (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    )}
                  </span>
                  <span className="font-medium truncate max-w-[120px]">{entityReference.name}</span>
                </div>
              )}

              {/* Timestamp */}
              <div
                className="text-xs"
                style={{
                  color: sender === 'user'
                    ? 'rgba(255, 255, 255, 0.7)'
                    : `${colors.text}70`
                }}
              >
                {formatTime(timestamp)}
              </div>
            </div>
          </>
        )}
      </div>

      {/* User icon for user messages */}
      {sender === 'user' && (
        <div className="flex flex-col justify-start items-center ml-2 mt-1">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-xs shadow-sm"
               style={{ backgroundColor: colors.secondary }}>
            {/* User's initials */}
            U
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ModernAIMessage;