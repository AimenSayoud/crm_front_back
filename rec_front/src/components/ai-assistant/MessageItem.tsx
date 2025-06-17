import React from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import { FiUser, FiBriefcase, FiCpu, FiLoader } from 'react-icons/fi';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  isLoading?: boolean;
  entityReference?: {
    type: 'candidate' | 'company';
    id: string;
    name: string;
  };
}

interface MessageItemProps {
  message: Message;
  isLast: boolean;
}

const MessageItem: React.FC<MessageItemProps> = ({ message, isLast }) => {
  const { colors, theme } = useTheme();
  const isUser = message.sender === 'user';
  
  const bgColor = isUser 
    ? (theme === 'light' ? colors.primary : `${colors.primary}BF`)
    : (theme === 'light' ? '#FFFFFF' : '#1E293B');
  
  const borderColor = isUser 
    ? 'transparent'
    : (theme === 'light' ? '#E2E8F0' : '#334155');
  
  const textColor = isUser
    ? '#FFFFFF'
    : colors.text;

  // Format timestamp
  const formattedTime = format(new Date(message.timestamp), 'h:mm a');
  
  // Handle entity reference
  const entityRef = message.entityReference;
  const showEntityRef = !isUser && entityRef;
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`relative max-w-[85%] md:max-w-[75%] ${isUser ? 'order-2' : 'order-1'}`}>
        {/* Avatar */}
        <div 
          className={`absolute top-0 ${isUser ? 'right-0 translate-x-1/2 -translate-y-1/2' : 'left-0 -translate-x-1/2 -translate-y-1/2'} w-8 h-8 rounded-full flex items-center justify-center z-10`}
          style={{ 
            backgroundColor: isUser ? colors.primary : (theme === 'light' ? '#E2E8F0' : '#334155'),
            border: `2px solid ${theme === 'light' ? '#F8FAFC' : '#0F172A'}`,
          }}
        >
          {isUser ? (
            <FiUser className="w-4 h-4 text-white" />
          ) : (
            <FiCpu className="w-4 h-4" style={{ color: colors.primary }} />
          )}
        </div>
      
        {/* Message Bubble */}
        <div 
          className={`relative rounded-xl px-4 py-3 ${isUser ? 'rounded-tr-none' : 'rounded-tl-none'} border shadow-sm`}
          style={{
            backgroundColor: bgColor,
            borderColor: borderColor,
            color: textColor,
            boxShadow: theme === 'light' 
              ? '0 1px 2px rgba(0, 0, 0, 0.05)' 
              : '0 1px 2px rgba(0, 0, 0, 0.1)',
          }}
        >
          {/* Entity Reference Badge */}
          {showEntityRef && (
            <div 
              className="absolute top-0 left-4 transform -translate-y-full flex items-center text-xs px-2 py-1 rounded-t-md mb-1"
              style={{ 
                backgroundColor: entityRef?.type === 'candidate' ? `${colors.primary}20` : `${colors.secondary}20`,
                color: entityRef?.type === 'candidate' ? colors.primary : colors.secondary,
              }}
            >
              {entityRef?.type === 'candidate' ? (
                <FiUser className="w-3 h-3 mr-1" />
              ) : (
                <FiBriefcase className="w-3 h-3 mr-1" />
              )}
              <span>{entityRef?.name}</span>
            </div>
          )}
          
          {/* Message Content */}
          {message.isLoading ? (
            <div className="flex items-center space-x-2">
              <FiLoader className="w-4 h-4 animate-spin" style={{ color: textColor }} />
              <span className="opacity-70">Thinking...</span>
            </div>
          ) : (
            <div className="prose dark:prose-invert max-w-none" 
              style={{ 
                color: textColor,
                fontSize: '0.9375rem',
              }}
            >
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}
          
          {/* Timestamp */}
          <div 
            className="text-[10px] mt-1 text-right opacity-60"
            style={{ color: textColor }}
          >
            {formattedTime}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageItem;
