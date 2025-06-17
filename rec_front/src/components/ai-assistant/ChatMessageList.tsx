// src/components/ai-assistant/ChatMessageList.tsx
import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MessageItem from './MessageItem';

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

interface ChatMessageListProps {
  messages: Message[];
}

const ChatMessageList: React.FC<ChatMessageListProps> = ({ messages }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom when messages change
  useEffect(() => { 
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); 
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
      <AnimatePresence initial={false}>
        {messages.map((message, index) => (
          <motion.div
            key={message.id}
            layout
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 25, 
              delay: Math.min(index * 0.03, 0.15) // Cap the delay for performance
            }}
          >
            <MessageItem
              message={message}
              isLast={index === messages.length - 1}
            />
          </motion.div>
        ))}
      </AnimatePresence>
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatMessageList;