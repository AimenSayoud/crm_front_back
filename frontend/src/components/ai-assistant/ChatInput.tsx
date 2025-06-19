// src/components/ai-assistant/ChatInput.tsx
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/app/context/ThemeContext';
import TextArea from '@/components/ui/TextArea'; 
import { FiSend, FiUser, FiBriefcase } from 'react-icons/fi';

interface ChatInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onSend: () => void;
  onSlashCommand: () => void;
  placeholder?: string;
  disabled?: boolean;
  entityName?: string | null;
  entityType?: "candidate" | "company" | null;
}

const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onKeyDown,
  onSend,
  onSlashCommand,
  placeholder = "Type a message or / for commands...",
  disabled = false,
  entityName = null,
  entityType = null,
}) => {
  const { colors, theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isLightTheme = theme === "light";

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "/" && value === "") {
      e.preventDefault();
      onSlashCommand();
      return;
    }
    onKeyDown(e);
  };

  // Highlight input when entity changes
  useEffect(() => {
    if (entityName && containerRef.current) {
      const inputElement = containerRef.current.querySelector("textarea");
      if (inputElement) {
        inputElement.style.transform = "scale(1.02)";
        setTimeout(() => {
          inputElement.style.transform = "scale(1)";
        }, 200);
      }
    }
  }, [entityName]);

  // Auto focus textarea on component mount
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const entityIcon = entityType === "candidate" ? <FiUser /> : <FiBriefcase />;
  const entityColor = entityType === "candidate" ? colors.primary : colors.secondary;
  const canSend = !disabled && value.trim().length > 0;

  return (
    <div className="relative w-full " ref={containerRef}>
      <AnimatePresence>
        {entityName && (
          <motion.div
            className="absolute -top-10 left-4 z-10 rounded-t-xl px-4 py-2 font-medium text-xs shadow-lg flex items-center gap-2 backdrop-blur-sm"
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            style={{
              background: isLightTheme 
                ? `linear-gradient(135deg, ${entityColor}15, ${entityColor}25)` 
                : `linear-gradient(135deg, ${entityColor}20, ${entityColor}30)`,
              color: entityColor,
              borderTop: `3px solid ${entityColor}`,
              borderLeft: `1px solid ${entityColor}30`,
              borderRight: `1px solid ${entityColor}30`,
              backdropFilter: "blur(8px)",
            }}
          >
            <div className="w-5 h-5 rounded-full flex items-center justify-center" 
                 style={{ background: `${entityColor}20` }}>
              {entityIcon}
            </div>
            <div className="flex flex-col">
              <span className="text-[0.65rem] uppercase tracking-wider font-bold opacity-80">Active Context</span>
              <span className="font-semibold text-sm">{entityName}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className={`relative flex items-end rounded-2xl transition-all duration-300  ${
          entityName ? "rounded-t-none border-t-0" : ""
        }`}
        style={{
          background: isLightTheme 
            ? "linear-gradient(135deg, #ffffff, #f8fafc)" 
            : "linear-gradient(135deg, #1e293b, #0f172a)",
          boxShadow: isFocused
            ? `0 0 0 3px ${colors.primary}30, 0 8px 25px rgba(0,0,0,0.12), 0 4px 10px rgba(0,0,0,0.08)`
            : isLightTheme
              ? "0 4px 15px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04)"
              : "0 4px 15px rgba(0,0,0,0.3), 0 2px 6px rgba(0,0,0,0.2)",
          border: `2px solid ${isFocused ? colors.primary : isLightTheme ? "#e2e8f0" : "#334155"}`,
          borderTopColor: entityName
            ? entityColor
            : isFocused
              ? colors.primary
              : isLightTheme
                ? "#e2e8f0"
                : "#334155",
        }}
        whileHover={{
          boxShadow: isFocused
            ? `0 0 0 3px ${colors.primary}30, 0 8px 25px rgba(0,0,0,0.12), 0 4px 10px rgba(0,0,0,0.08)`
            : isLightTheme
              ? "0 6px 20px rgba(0,0,0,0.1), 0 3px 8px rgba(0,0,0,0.06)"
              : "0 6px 20px rgba(0,0,0,0.4), 0 3px 8px rgba(0,0,0,0.3)",
        }}
        transition={{ duration: 0.2 }}
      >
        <div className="relative flex-1 bg-transparent rounded-xl overflow-hidden flex items-stretch h-full">
          <TextArea
            ref={textareaRef}
            value={value}
            onChange={onChange}
            onKeyDown={handleInputKeyDown}
            placeholder={placeholder}
            rows={1}
            maxRows={6}
            fullWidth
            className="resize-none pr-16 border-0 shadow-none focus:shadow-none focus:ring-0 transition-all duration-200 bg-transparent h-full flex-1"
            style={{
              padding: "1rem 1rem",
              fontSize: "0.95rem",
              lineHeight: "1.6",
              outline: "none",
              color: colors.text,
              minHeight: "60px",
              height: "100%",
              fontWeight: "400",
            }}
            disabled={disabled}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            aria-label="Message input"
          /> 
        </div>
          {/* sending button */}
        <motion.button
          onClick={onSend}
          disabled={!canSend}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl flex items-center justify-center transition-all duration-300 transform"
          title="Send message (Enter)"
          style={{
            width: "46px",
            height: "46px",
            background: canSend
              ? `linear-gradient(135deg, ${colors.primary}, ${colors.primary}dd)`
              : isLightTheme
                ? "linear-gradient(135deg, #f1f5f9, #e2e8f0)"
                : "linear-gradient(135deg, #334155, #475569)",
            color: canSend ? "#FFFFFF" : isLightTheme ? "#94a3b8" : "#64748b",
            opacity: canSend ? 1 : 0.7,
          }}
          whileHover={canSend ? { 
            scale: 1.08,
            boxShadow: `0 4px 15px ${colors.primary}40`
          } : { scale: 1.02 }}
          whileTap={canSend ? { scale: 0.95 } : { scale: 0.98 }}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{
            scale: 1,
            opacity: 1,
            boxShadow: canSend ? `0 3px 12px ${colors.primary}30` : "none",
          }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 20,
          }}
        >
          <FiSend className="w-5 h-5" />
        </motion.button>

      </motion.div>
 
    </div>
  );
};

export default ChatInput;