'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/app/context/ThemeContext';
import useMessagingStore from '@/store/useMessagingStore';
import { 
  FiSend, FiPaperclip, FiCalendar, FiClock, FiChevronDown, 
  FiSmile, FiBold, FiItalic, FiList, FiLink, FiImage, FiX, FiType
} from 'react-icons/fi';
import { EntityReference, MessageTemplate, MessageAttachment } from '@/types';

interface MessageComposerProps {
  conversationId?: string;
  onSendMessage?: (content: string, attachments?: MessageAttachment[]) => Promise<void>;
  onScheduleMessage?: (content: string, scheduledFor: Date) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
  availableEntities?: EntityReference[];
}

const MessageComposer: React.FC<MessageComposerProps> = ({
  conversationId,
  onSendMessage,
  onScheduleMessage,
  disabled = false,
  placeholder = 'Type a message...',
  availableEntities = [],
}) => {
  const { colors, theme } = useTheme();
  const { 
    draftMessage, 
    updateDraftMessage,
    uploadAttachment,
    attachments,
    removeAttachment,
    clearAttachments,
    isSendingMessage,
    isUploadingAttachment,
    uploadError,
    sendError,
    resetErrors,
    messageTemplates,
    fetchMessageTemplates
  } = useMessagingStore();
  
  const [content, setContent] = useState(draftMessage || '');
  const [showFormatting, setShowFormatting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);
  const [showEntities, setShowEntities] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null);
  const [scheduledTime, setScheduledTime] = useState('12:00');
  const [selectedEntities, setSelectedEntities] = useState<EntityReference[]>([]);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Fetch templates if needed
  useEffect(() => {
    if (messageTemplates.length === 0) {
      fetchMessageTemplates();
    }
  }, [messageTemplates.length, fetchMessageTemplates]);
  
  // Update local content when draftMessage changes
  useEffect(() => {
    setContent(draftMessage || '');
  }, [draftMessage]);
  
  // Update draft message in store when content changes
  useEffect(() => {
    updateDraftMessage(content);
  }, [content, updateDraftMessage]);
  
  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '0px'; // Reset height
      const scrollHeight = textareaRef.current.scrollHeight;
      // Set max height of 200px, but allow growing up to that
      textareaRef.current.style.height = `${Math.min(scrollHeight, 200)}px`;
    }
  }, [content]);
  
  // Handle sending message
  const handleSend = async () => {
    if (disabled || !content.trim()) return;
    
    try {
      if (onSendMessage) {
        await onSendMessage(content, attachments);
      }
      
      setContent('');
      clearAttachments();
      setSelectedEntities([]);
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };
  
  // Handle scheduling message
  const handleSchedule = async () => {
    if (disabled || !content.trim() || !scheduledDate || !scheduledTime || !onScheduleMessage) return;
    
    // Combine date and time
    const [hours, minutes] = scheduledTime.split(':').map(Number);
    const scheduledDateTime = new Date(scheduledDate);
    scheduledDateTime.setHours(hours, minutes);
    
    try {
      await onScheduleMessage(content, scheduledDateTime);
      
      setContent('');
      clearAttachments();
      setSelectedEntities([]);
      setScheduledDate(null);
      setScheduledTime('12:00');
      setShowScheduler(false);
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('Error scheduling message:', error);
    }
  };
  
  // Handle attachment button click
  const handleAttachmentClick = () => {
    if (disabled || attachments.length >= 5) return;
    fileInputRef.current?.click();
  };
  
  // Handle file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    // Upload each file
    Array.from(files).forEach(file => {
      uploadAttachment(file);
    });
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Toggle formatting toolbar
  const toggleFormatting = () => {
    setShowFormatting(prev => !prev);
    setShowEmojiPicker(false);
    setShowTemplates(false);
    setShowScheduler(false);
    setShowEntities(false);
  };
  
  // Toggle emoji picker
  const toggleEmojiPicker = () => {
    setShowEmojiPicker(prev => !prev);
    setShowFormatting(false);
    setShowTemplates(false);
    setShowScheduler(false);
    setShowEntities(false);
  };
  
  // Toggle templates menu
  const toggleTemplates = () => {
    setShowTemplates(prev => !prev);
    setShowFormatting(false);
    setShowEmojiPicker(false);
    setShowScheduler(false);
    setShowEntities(false);
  };
  
  // Toggle scheduler
  const toggleScheduler = () => {
    setShowScheduler(prev => !prev);
    setShowFormatting(false);
    setShowEmojiPicker(false);
    setShowTemplates(false);
    setShowEntities(false);
  };
  
  // Toggle entities menu
  const toggleEntities = () => {
    setShowEntities(prev => !prev);
    setShowFormatting(false);
    setShowEmojiPicker(false);
    setShowTemplates(false);
    setShowScheduler(false);
  };
  
  // Apply formatting
  const applyFormatting = (type: string) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    let formattedText = '';
    let newCursorPos = end;
    
    switch (type) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        newCursorPos = start + formattedText.length;
        break;
      case 'italic':
        formattedText = `_${selectedText}_`;
        newCursorPos = start + formattedText.length;
        break;
      case 'list':
        formattedText = `\n- ${selectedText}`;
        newCursorPos = start + formattedText.length;
        break;
      case 'link':
        formattedText = `[${selectedText}](url)`;
        newCursorPos = start + selectedText.length + 3; // Place cursor in the url area
        break;
      default:
        return;
    }
    
    const newContent = content.substring(0, start) + formattedText + content.substring(end);
    setContent(newContent);
    
    // Re-focus and set cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };
  
  // Handle selecting a template
  const handleSelectTemplate = (template: MessageTemplate) => {
    setContent(template.content);
    setShowTemplates(false);
  };
  
  // Handle entity selection
  const toggleEntitySelection = (entity: EntityReference) => {
    setSelectedEntities(prev => {
      const exists = prev.some(e => e.id === entity.id && e.type === entity.type);
      
      if (exists) {
        return prev.filter(e => !(e.id === entity.id && e.type === entity.type));
      } else {
        return [...prev, entity];
      }
    });
  };
  
  // Get entity icon based on type
  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'candidate':
        return '👤';
      case 'job':
        return '💼';
      case 'company':
        return '🏢';
      case 'application':
        return '📝';
      default:
        return '🔗';
    }
  };
  
  return (
    <div className="border-t pt-3" style={{ borderColor: colors.border }}>
      {/* Selected Entities Rendered Above Composer */}
      {selectedEntities.length > 0 && (
        <div className="px-4 mb-2 flex flex-wrap gap-2">
          {selectedEntities.map(entity => (
            <div 
              key={`${entity.type}-${entity.id}`}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs"
              style={{ 
                backgroundColor: theme === 'light' ? `${colors.primary}15` : `${colors.primary}30`,
                color: colors.primary
              }}
            >
              <span>{getEntityIcon(entity.type)}</span>
              <span>{entity.name}</span>
              <button
                type="button"
                className="hover:bg-black/10 rounded-full p-0.5"
                onClick={() => toggleEntitySelection(entity)}
                aria-label={`Remove ${entity.name}`}
              >
                <FiX className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
      
      {/* Attachments */}
      {attachments.length > 0 && (
        <div className="px-4 mb-3">
          <div className="flex flex-wrap gap-2">
            {attachments.map(attachment => (
              <div 
                key={attachment.id}
                className="relative group p-2 border rounded-lg flex items-center gap-2"
                style={{
                  backgroundColor: theme === 'light' ? '#F9FAFB' : '#1F2937',
                  borderColor: colors.border
                }}
              >
                {attachment.file_type.startsWith('image/') ? (
                  <div className="w-10 h-10 rounded overflow-hidden flex items-center justify-center"
                    style={{ backgroundColor: theme === 'light' ? '#E5E7EB' : '#374151' }}>
                    <img 
                      src={attachment.url} 
                      alt={attachment.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded flex items-center justify-center"
                    style={{ backgroundColor: theme === 'light' ? '#E5E7EB' : '#374151' }}>
                    <FiPaperclip className="w-5 h-5" style={{ color: theme === 'light' ? '#6B7280' : '#9CA3AF' }} />
                  </div>
                )}
                <div className="overflow-hidden">
                  <div className="text-sm font-medium truncate max-w-[150px]">{attachment.name}</div>
                  <div className="text-xs text-gray-500">
                    {(attachment.file_size / 1024).toFixed(0)} KB
                  </div>
                </div>
                <button
                  className="absolute -top-2 -right-2 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-200 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeAttachment(attachment.id)}
                  aria-label="Remove attachment"
                >
                  <FiX className="w-3 h-3" />
                </button>
              </div>
            ))}
            
            {isUploadingAttachment && (
              <div className="p-2 border rounded-lg flex items-center gap-2"
                style={{
                  backgroundColor: theme === 'light' ? '#F9FAFB' : '#1F2937',
                  borderColor: colors.border
                }}>
                <div className="w-10 h-10 rounded flex items-center justify-center"
                  style={{ backgroundColor: theme === 'light' ? '#E5E7EB' : '#374151' }}>
                  <div className="w-5 h-5 border-2 border-gray-400 border-t-primary rounded-full animate-spin" />
                </div>
                <div>
                  <div className="text-sm font-medium">Uploading...</div>
                  <div className="text-xs" style={{ color: `${colors.text}80` }}>Please wait</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Formatting Toolbar */}
      <AnimatePresence>
        {showFormatting && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
            className="px-4 pb-2 flex flex-wrap border-b"
            style={{ borderColor: colors.border }}
          >
            <div className="flex items-center gap-1 w-full">
              <button 
                className={`p-2 rounded-md ${theme === 'light' ? 'hover:bg-gray-100' : 'hover:bg-gray-800'}`}
                onClick={() => applyFormatting('bold')}
                aria-label="Bold"
              >
                <FiBold className="w-4 h-4" />
              </button>
              <button 
                className={`p-2 rounded-md ${theme === 'light' ? 'hover:bg-gray-100' : 'hover:bg-gray-800'}`}
                onClick={() => applyFormatting('italic')}
                aria-label="Italic"
              >
                <FiItalic className="w-4 h-4" />
              </button>
              <button 
                className={`p-2 rounded-md ${theme === 'light' ? 'hover:bg-gray-100' : 'hover:bg-gray-800'}`}
                onClick={() => applyFormatting('list')}
                aria-label="List"
              >
                <FiList className="w-4 h-4" />
              </button>
              <button 
                className={`p-2 rounded-md ${theme === 'light' ? 'hover:bg-gray-100' : 'hover:bg-gray-800'}`}
                onClick={() => applyFormatting('link')}
                aria-label="Link"
              >
                <FiLink className="w-4 h-4" />
              </button>
              <div className="ml-auto text-xs italic" style={{ color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
                Formatting uses Markdown
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Emoji Picker */}
      <AnimatePresence>
        {showEmojiPicker && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
            className="px-4 pb-2 border-b"
            style={{ borderColor: colors.border }}
          >
            <div className="p-3 text-sm text-center" style={{ color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
              Emoji picker would be implemented here. For now, you can type emoji directly or use markdown :smile:
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Templates Menu */}
      <AnimatePresence>
        {showTemplates && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
            className="px-4 pb-2 border-b"
            style={{ borderColor: colors.border }}
          >
            {messageTemplates.length > 0 ? (
              <div className="max-h-40 overflow-y-auto py-2">
                {messageTemplates.map(template => (
                  <button
                    key={template.id}
                    className={`w-full text-left p-2 rounded-md mb-1 transition-colors ${theme === 'light' ? 'hover:bg-gray-100' : 'hover:bg-gray-800'}`}
                    onClick={() => handleSelectTemplate(template)}
                  >
                    <div className="text-sm font-medium">{template.name}</div>
                    <div className="text-xs truncate" style={{ color: `${colors.text}80` }}>{template.content.substring(0, 60)}...</div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-3 text-sm text-center" style={{ color: `${colors.text}80` }}>
                No message templates available
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Scheduler */}
      <AnimatePresence>
        {showScheduler && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
            className="px-4 pb-2 border-b"
            style={{ borderColor: colors.border }}
          >
            <div className="p-3">
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1" style={{ color: colors.text }}>Date</label>
                <input 
                  type="date" 
                  className="w-full p-2 border rounded-md"
                  style={{
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    color: colors.text
                  }}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setScheduledDate(e.target.value ? new Date(e.target.value) : null)}
                />
              </div>
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1" style={{ color: colors.text }}>Time</label>
                <input 
                  type="time" 
                  className="w-full p-2 border rounded-md"
                  style={{
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    color: colors.text
                  }}
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  className={`px-3 py-1.5 text-sm rounded-md ${theme === 'light' ? 'hover:bg-gray-200' : 'hover:bg-gray-600'}`}
                  style={{ 
                    backgroundColor: theme === 'light' ? '#F3F4F6' : '#374151',
                    color: colors.text
                  }}
                  onClick={() => setShowScheduler(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-3 py-1.5 text-sm rounded-md bg-primary text-white hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!scheduledDate || !content.trim()}
                  onClick={handleSchedule}
                >
                  Schedule Message
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Entity Selection */}
      <AnimatePresence>
        {showEntities && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
            className="px-4 pb-2 border-b"
            style={{ borderColor: colors.border }}
          >
            {availableEntities.length > 0 ? (
              <div>
                <div className="pt-2 pb-1 text-xs font-medium" style={{ color: `${colors.text}80` }}>
                  Select entities to reference in your message
                </div>
                <div className="max-h-40 overflow-y-auto mb-2">
                  {availableEntities.map(entity => (
                    <div
                      key={`${entity.type}-${entity.id}`}
                      className={`flex items-center p-2 rounded-md cursor-pointer ${
                        selectedEntities.some(e => e.id === entity.id && e.type === entity.type)
                          ? (theme === 'light' ? 'bg-gray-100' : 'bg-gray-800')
                          : ''
                      } ${theme === 'light' ? 'hover:bg-gray-100' : 'hover:bg-gray-800'}`}
                      onClick={() => toggleEntitySelection(entity)}
                    >
                      <div className="w-5 h-5 mr-3 flex items-center justify-center text-xs">
                        {getEntityIcon(entity.type)}
                      </div>
                      <div>
                        <div className="text-sm font-medium">{entity.name}</div>
                        <div className="text-xs capitalize" style={{ color: `${colors.text}80` }}>{entity.type}</div>
                      </div>
                      {selectedEntities.some(e => e.id === entity.id && e.type === entity.type) && (
                        <div className="ml-auto">
                          <div className="w-5 h-5 bg-primary text-white rounded-full flex items-center justify-center">
                            <FiCheck className="w-3 h-3" />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    className={`px-3 py-1.5 text-sm rounded-md ${theme === 'light' ? 'hover:bg-gray-200' : 'hover:bg-gray-600'}`}
                    style={{ 
                      backgroundColor: theme === 'light' ? '#F3F4F6' : '#374151',
                      color: colors.text
                    }}
                    onClick={() => setShowEntities(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-3 py-1.5 text-sm rounded-md bg-primary text-white hover:bg-primary-dark"
                    onClick={() => setShowEntities(false)}
                  >
                    {selectedEntities.length === 0 ? 'Close' : `Attach ${selectedEntities.length} ${selectedEntities.length === 1 ? 'Entity' : 'Entities'}`}
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3 text-sm text-center" style={{ color: `${colors.text}80` }}>
                No entities available to reference
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Composer Main UI */}
      <div className="px-4 flex items-end gap-2">
        {/* Actions Toolbar */}
        <div className="flex flex-col">
          <button
            className={`p-2 mb-1 rounded-full ${showFormatting ? 'text-primary' : ''}`}
            style={{ 
              backgroundColor: showFormatting 
                ? (theme === 'light' ? '#F3F4F6' : '#374151') 
                : 'transparent',
              color: showFormatting ? colors.primary : colors.text
            }}
            onClick={toggleFormatting}
            disabled={disabled}
            aria-label="Formatting options"
          >
            <FiType className="w-4 h-4" />
          </button>
          <button
            className={`p-2 mb-1 rounded-full ${showEmojiPicker ? 'text-primary' : ''}`}
            style={{ 
              backgroundColor: showEmojiPicker 
                ? (theme === 'light' ? '#F3F4F6' : '#374151') 
                : 'transparent',
              color: showEmojiPicker ? colors.primary : colors.text
            }}
            onClick={toggleEmojiPicker}
            disabled={disabled}
            aria-label="Emoji picker"
          >
            <FiSmile className="w-4 h-4" />
          </button>
          <button
            className="p-2 mb-1 rounded-full relative"
            style={{ 
              backgroundColor: 'transparent',
              color: colors.text
            }}
            onClick={handleAttachmentClick}
            disabled={disabled || attachments.length >= 5}
            aria-label="Attach file"
          >
            <FiPaperclip className="w-4 h-4" />
            {attachments.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-white text-[10px] rounded-full flex items-center justify-center">
                {attachments.length}
              </span>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            multiple
            onChange={handleFileChange}
            accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
          />
        </div>
        
        {/* Text Composer */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            className={`w-full p-3 pr-10 rounded-lg border focus:ring-2 focus:ring-primary focus:border-transparent resize-none overflow-auto
              ${disabled ? 'cursor-not-allowed' : ''}
            `}
            style={{ 
              backgroundColor: disabled ? (theme === 'light' ? '#F3F4F6' : '#374151') : colors.card,
              borderColor: colors.border,
              color: colors.text,
              minHeight: '44px',
              maxHeight: '200px'
            }}
            placeholder={placeholder}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={disabled}
            rows={1}
          />
          
          {/* Quick Actions Dropdown */}
          <div className="absolute right-2 bottom-2 flex gap-1">
            {messageTemplates.length > 0 && (
              <button
                className={`p-2 rounded-full ${showTemplates ? 'text-primary' : ''}`}
                style={{ 
                  backgroundColor: showTemplates 
                    ? (theme === 'light' ? '#F3F4F6' : '#374151') 
                    : 'transparent',
                  color: showTemplates ? colors.primary : colors.text
                }}
                onClick={toggleTemplates}
                disabled={disabled}
                aria-label="Message templates"
              >
                <FiChevronDown className="w-4 h-4" />
              </button>
            )}
            
            {onScheduleMessage && (
              <button
                className={`p-2 rounded-full ${showScheduler ? 'text-primary' : ''}`}
                style={{ 
                  backgroundColor: showScheduler 
                    ? (theme === 'light' ? '#F3F4F6' : '#374151') 
                    : 'transparent',
                  color: showScheduler ? colors.primary : colors.text
                }}
                onClick={toggleScheduler}
                disabled={disabled}
                aria-label="Schedule message"
              >
                <FiClock className="w-4 h-4" />
              </button>
            )}
            
            {availableEntities.length > 0 && (
              <button
                className={`p-2 rounded-full ${showEntities ? 'text-primary' : ''}`}
                style={{ 
                  backgroundColor: showEntities 
                    ? (theme === 'light' ? '#F3F4F6' : '#374151') 
                    : 'transparent',
                  color: showEntities ? colors.primary : colors.text
                }}
                onClick={toggleEntities}
                disabled={disabled}
                aria-label="Attach entities"
              >
                <FiLink className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        
        {/* Send Button */}
        <button 
          className={`p-3 rounded-full transition-colors ${
            !disabled && content.trim() ? '' : 'cursor-not-allowed'
          }`}
          style={{
            backgroundColor: !disabled && content.trim() ? colors.primary : theme === 'light' ? '#E5E7EB' : '#374151',
            color: !disabled && content.trim() ? 'white' : theme === 'light' ? '#9CA3AF' : '#6B7280'
          }}
          onClick={handleSend}
          disabled={disabled || !content.trim() || isSendingMessage}
          aria-label="Send message"
        >
          {isSendingMessage ? (
            <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin" />
          ) : (
            <FiSend className="w-4 h-4" />
          )}
        </button>
      </div>
      
      {/* Error messages */}
      {(sendError || uploadError) && (
        <div className="px-4 mt-2 text-xs text-red-500">
          {sendError && <p>Error sending message: {sendError}</p>}
          {uploadError && <p>Error uploading attachment: {uploadError}</p>}
        </div>
      )}
    </div>
  );
};

export default MessageComposer;

// Helper component for the check icon
const FiCheck: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);