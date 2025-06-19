'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  FiMessageCircle, FiArrowLeft, FiInfo, FiPhone, FiVideo,
  FiMoreVertical, FiPaperclip, FiStar, FiX, FiCalendar,
  FiLink, FiClock, FiBriefcase, FiFile, FiUser, FiCheck,
  FiInbox, FiSend, FiArchive, FiTrash2, FiFilter, FiSearch,
  FiPlus, FiChevronDown, FiRefreshCw, FiMail, FiTag, FiFlag,
  FiMenu, FiChevronRight, FiCornerDownLeft,
  FiUsers
} from 'react-icons/fi';
import { useTheme } from '@/app/context/ThemeContext';
import useMessagingStore from '@/store/useMessagingStore';
import MessageComposer from '@/components/messaging/MessageComposer';
import RecipientSelector from '@/components/messaging/RecipientSelector';
import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns';
import { MessageStatus, Participant, MessageAttachment, Conversation } from '@/types';

const MessagingPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { colors, theme } = useTheme();
  const {
    conversations,
    filteredConversations,
    activeConversation,
    messages,
    isLoadingMessages,
    isLoadingConversations,
    messagesError,
    conversationsError,
    isComposing,
    selectedRecipients,
    draftMessage,
    showContactDetails,
    fetchMessages,
    fetchConversation,
    fetchConversations,
    sendMessage,
    markMessagesAsRead,
    createConversation,
    toggleContactDetails,
    cancelComposing,
    selectRecipient,
    removeRecipient,
    updateDraftMessage,
    startComposing,
    resetErrors,
    setActiveConversation,
    setSearchTerm,
    setActiveFilter,
    filterConversations,
    searchTerm,
    activeFilter,
    unreadCount,
    deleteConversation
  } = useMessagingStore();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [unreadIndicatorVisible, setUnreadIndicatorVisible] = useState(false);
  const [newUnreadMessages, setNewUnreadMessages] = useState<string[]>([]);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [selectedConversations, setSelectedConversations] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [sortBy, setSortBy] = useState('recent');
  
  // Initialize - Fetch user conversations
  useEffect(() => {
    fetchConversations("7");
  }, [fetchConversations]);
  
  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current && isAtBottom) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    } else if (messages.length > 0) {
      // If user isn't at bottom, show unread indicator
      setUnreadIndicatorVisible(true);
    }
  }, [messages, isAtBottom]);
  
  // Load conversation from URL parameter and fetch messages
  useEffect(() => {
    const conversationId = searchParams.get('id');
    if (conversationId && !isComposing) {
      // If we have an ID in URL but no active conversation, fetch it
      if (!activeConversation || activeConversation.id !== conversationId) {
        fetchConversation(conversationId);
      }
      // Fetch messages for this conversation
      fetchMessages(conversationId);
    }
  }, [searchParams, activeConversation, fetchMessages, fetchConversation, isComposing]);
  
  // Handle scroll events to detect if user is at bottom
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isBottom = scrollHeight - scrollTop - clientHeight < 50;
    setIsAtBottom(isBottom);
    
    if (isBottom) {
      setUnreadIndicatorVisible(false);
    }
  };
  
  // Mark message as read when it becomes visible
  const handleMessageInView = (messageId: string) => {
    if (newUnreadMessages.includes(messageId)) {
      markMessagesAsRead([messageId]);
      setNewUnreadMessages(prev => prev.filter(id => id !== messageId));
    }
  };
  
  // Handle send message
  const handleSendMessage = async (content: string, attachments?: MessageAttachment[]) => {
    if (!content.trim()) return;
    
    const currentUser: Participant = {
      id: "7", // You'd get this from auth
      name: "Admin User",
      type: "admin",
      avatar: null
    };
    
    if (isComposing) {
      // Create new conversation with selected recipients
      if (selectedRecipients.length === 0) return;
      
      const conversationData = {
        title: null,
        participants: [currentUser, ...selectedRecipients],
        type: selectedRecipients.length > 1 ? 'group' : 'individual' as any,
      };
      
      const conversationId = await createConversation(conversationData);
      
      if (conversationId) {
        // Send message using the new conversation
        const messageData = {
          content,
          sender: currentUser,
          recipients: selectedRecipients,
          conversation_id: conversationId,
          attachments: attachments
        };
        
        await sendMessage(messageData);
        // router.push(`/messages?id=${conversationId}`);
      }
    } else if (activeConversation) {
      // Send message to existing conversation
      const messageData = {
        content,
        sender: currentUser,
        recipients: activeConversation.participants.filter(p => p.id !== currentUser.id),
        conversation_id: activeConversation.id,
        attachments: attachments
      };
      
      await sendMessage(messageData);
    }
  };
  
  // Handle back button
  const handleBack = () => {
    if (isComposing) {
      cancelComposing();
    } else if (window.innerWidth < 768) {
      // On mobile, go back to conversations list
      setActiveConversation(null);
      router.push('/messages');
    } else {
      router.push('/messages');
    }
  };
  
  // Handle new message if no active conversation
  useEffect(() => {
    // If no conversation ID in URL and not composing, start compose mode
    const conversationId = searchParams.get('id');
    const composeMode = searchParams.get('compose');
    
    if (composeMode === 'new' && !isComposing) {
      startComposing();
    } else if (!conversationId && !isComposing && !activeConversation && window.innerWidth >= 768) {
      // Only auto-select first conversation if we're on desktop
      if (filteredConversations.length > 0) {
        const firstConversation = filteredConversations[0];
        setActiveConversation(firstConversation);
        // router.push(`/messages?id=${firstConversation.id}`);
      }
    }
  }, [searchParams, isComposing, activeConversation, filteredConversations, startComposing, setActiveConversation, router]);
  
  // Clear errors when component unmounts
  useEffect(() => {
    return () => {
      resetErrors();
    };
  }, [resetErrors]);
  
  // Handle click on a conversation
  const handleConversationClick = (conversation: Conversation) => {
    if (selectedConversations.length > 0) {
      handleSelectConversation(conversation.id);
    } else {
      setActiveConversation(conversation);
      // router.push(`/messages?id=${conversation.id}`);
    }
  };
  
  // Handle conversation selection for bulk actions
  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversations(prev => {
      if (prev.includes(conversationId)) {
        return prev.filter(id => id !== conversationId);
      } else {
        return [...prev, conversationId];
      }
    });
  };
  
  // Handle select all
  const handleSelectAll = () => {
    if (selectedConversations.length === filteredConversations.length) {
      // Deselect all
      setSelectedConversations([]);
    } else {
      // Select all
      setSelectedConversations(filteredConversations.map(c => c.id));
    }
  };
  
  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedConversations.length} selected conversation(s)?`)) {
      return;
    }
    
    // Process each deletion
    const results = await Promise.all(
      selectedConversations.map(id => deleteConversation(id))
    );
    
    // Reset selection
    setSelectedConversations([]);
    setShowBulkActions(false);
    
    // If active conversation was deleted, clear it
    if (activeConversation && selectedConversations.includes(activeConversation.id)) {
      setActiveConversation(null);
      router.push('/messages');
    }
  };
  
  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  // Get avatar for a participant
  const getParticipantAvatar = (participant: Participant) => {
    if (participant?.avatar) {
      return (
        <img 
          src={participant.avatar} 
          alt={participant.name}
          className="w-full h-full rounded-full object-cover"
        />
      );
    }
    
    // Show icon based on participant type
    let icon;
    let bgColor;
    let iconColor;
    
    switch (participant.type) {
      case 'candidate':
        icon = <FiUser className="w-6 h-6" />;
        bgColor = theme === 'light' ? '#EBF5FF' : '#1E3A8A';
        iconColor = theme === 'light' ? '#2563EB' : '#60A5FA';
        break;
      case 'employer':
        icon = <FiBriefcase className="w-6 h-6" />;
        bgColor = theme === 'light' ? '#F0FDF4' : '#14532D';
        iconColor = theme === 'light' ? '#16A34A' : '#4ADE80';
        break;
      case 'admin':
        icon = <FiCheck className="w-6 h-6" />;
        bgColor = theme === 'light' ? '#EFF6FF' : '#172554';
        iconColor = theme === 'light' ? '#3B82F6' : '#93C5FD';
        break;
      case 'consultant':
        icon = <FiCalendar className="w-6 h-6" />;
        bgColor = theme === 'light' ? '#FEF3C7' : '#78350F';
        iconColor = theme === 'light' ? '#D97706' : '#FBBF24';
        break;
      default:
        icon = <FiMessageCircle className="w-6 h-6" />;
        bgColor = theme === 'light' ? '#E2E8F0' : '#334155';
        iconColor = theme === 'light' ? '#64748B' : '#94A3B8';
    }
    
    return (
      <div className="w-full h-full rounded-full flex items-center justify-center" style={{ backgroundColor: bgColor }}>
        <div style={{ color: iconColor }}>{icon}</div>
      </div>
    );
  };
  
  // Group messages by date
  const groupMessagesByDate = () => {
    const groups: { date: string; messages: typeof messages }[] = [];
    let currentDate = '';
    
    messages.forEach(message => {
      const messageDate = new Date(message.created_at);
      const dateStr = format(messageDate, 'yyyy-MM-dd');
      
      if (dateStr !== currentDate) {
        currentDate = dateStr;
        groups.push({
          date: dateStr,
          messages: [message]
        });
      } else {
        groups[groups.length - 1].messages.push(message);
      }
    });
    
    return groups;
  };
  
  // Format date header
  const formatDateHeader = (dateStr: string) => {
    const date = new Date(dateStr);
    
    if (isToday(date)) {
      return 'Today';
    } else if (isYesterday(date)) {
      return 'Yesterday';
    }
    
    return format(date, 'EEEE, MMMM d, yyyy');
  };
  
  // Format message time
  const formatMessageTime = (dateStr: string) => {
    return format(new Date(dateStr), 'h:mm a');
  };
  
  // Format conversation time (relative)
  const formatConversationTime = (dateStr: string) => {
    const date = new Date(dateStr);
    
    if (isToday(date)) {
      return format(date, 'h:mm a');
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else if (new Date().getFullYear() === date.getFullYear()) {
      return format(date, 'MMM d');
    } else {
      return format(date, 'MM/dd/yy');
    }
  };
  
  // Render message status icon
  const renderMessageStatus = (status: MessageStatus) => {
    switch (status) {
      case MessageStatus.READ:
        return (
          <div className="text-primary-500">
            <FiCheck className="w-4 h-4" />
          </div>
        );
      case MessageStatus.DELIVERED:
        return (
          <div style={{ color: theme === 'light' ? '#94A3B8' : '#64748B' }}>
            <FiCheck className="w-4 h-4" />
          </div>
        );
      case MessageStatus.SENT:
        return (
          <div style={{ color: theme === 'light' ? '#CBD5E1' : '#475569' }}>
            <FiCheck className="w-4 h-4" />
          </div>
        );
      case MessageStatus.FAILED:
        return (
          <div className="text-red-500">
            <FiX className="w-4 h-4" />
          </div>
        );
      default:
        return null;
    }
  };
  
  // Render attachment
  const renderAttachment = (attachment: MessageAttachment) => {
    return (
      <div 
        key={attachment.id}
        className="relative group p-2 border rounded-lg flex items-center gap-2 my-2"
        style={{
          backgroundColor: theme === 'light' ? '#F9FAFB' : '#1F2937',
          borderColor: colors.border
        }}
      >
        <div className="w-10 h-10 rounded flex items-center justify-center"
          style={{ backgroundColor: theme === 'light' ? '#E5E7EB' : '#374151' }}
        >
          <FiFile className="w-5 h-5" style={{ color: theme === 'light' ? '#6B7280' : '#9CA3AF' }} />
        </div>
        <div>
          <div className="text-sm font-medium">{attachment.name}</div>
          <div className="text-xs" style={{ color: `${colors.text}80` }}>
            {(attachment.file_size / 1024).toFixed(0)} KB
          </div>
        </div>
      </div>
    );
  };
  
  // Get truncated preview text
  const getTruncatedPreview = (text: string, maxLength = 60) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };
  
  // Mobile navigation helper
  const isMobileConversationView = () => {
    return window.innerWidth < 768 && (activeConversation || isComposing);
  };
  
  return (
    <div className="flex flex-col h-screen">
      {/* Mobile Header - shown on small screens */}
      <div 
        className="md:hidden px-4 py-3 flex items-center justify-between border-b relative z-10"
        style={{ borderColor: colors.border }}
      >
        {isMobileConversationView() ? (
          // Show back button when viewing conversation on mobile
          <button
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={handleBack}
            aria-label="Back to messages"
          >
            <FiArrowLeft className="w-5 h-5" style={{ color: colors.text }} />
          </button>
        ) : (
          // Show menu toggle when viewing inbox on mobile
          <button
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            aria-label="Toggle menu"
          >
            <FiMenu className="w-5 h-5" style={{ color: colors.text }} />
          </button>
        )}
        
        <h1 className="text-lg font-medium" style={{ color: colors.text }}>
          {isMobileConversationView()
            ? (activeConversation?.title || (activeConversation?.participants[0]?.name || 'New Message'))
            : 'Messages'}
        </h1>
        
        <div className="flex items-center gap-1">
          {isMobileConversationView() ? (
            activeConversation && (
              <button
                className={`p-2 rounded-full ${showContactDetails ? 'bg-gray-100 dark:bg-gray-800' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                onClick={toggleContactDetails}
                aria-label="Contact info"
              >
                <FiInfo className="w-5 h-5" style={{ color: showContactDetails ? colors.primary : colors.text }} />
              </button>
            )
          ) : (
            <button
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => {
                startComposing();
                router.push('/messages?compose=new');
              }}
              aria-label="Compose new message"
            >
              <FiPlus className="w-5 h-5" style={{ color: colors.text }} />
            </button>
          )}
        </div>
      </div>
      
      {/* Desktop Header - shown on md+ screens */}
      <div 
        className="hidden md:flex px-4 py-3 items-center justify-between border-b"
        style={{ borderColor: colors.border }}
      >
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-medium" style={{ color: colors.text }}>Messaging</h1>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search messages..."
              className="w-64 pl-9 pr-4 py-2 rounded-lg border outline-none"
              style={{
                backgroundColor: colors.card,
                borderColor: colors.border,
                color: colors.text
              }}
              value={searchTerm}
              onChange={handleSearchChange}
            />
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: `${colors.text}80` }} />
          </div>
          
          <button
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={() => fetchConversations("7")}
            aria-label="Refresh"
          >
            <FiRefreshCw className="w-5 h-5" style={{ color: colors.text }} />
          </button>
          
          <button
            className="px-3 py-1.5 rounded-md flex items-center gap-1"
            style={{ 
              backgroundColor: colors.primary,
              color: 'white'
            }}
            onClick={() => {
              startComposing();
              router.push('/messages?compose=new');
            }}
          >
            <FiPlus className="w-4 h-4" />
            <span className="font-medium">New Message</span>
          </button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Folders and Filters */}
        <div 
          className={`${showMobileMenu ? 'block' : 'hidden'} md:block w-full md:w-56 border-r flex-shrink-0 md:z-auto z-20 md:relative absolute inset-0 bg-inherit`}
          style={{ borderColor: colors.border }}
        >
          <div className="h-full flex flex-col">
            {/* Mobile Close Button */}
            <div className="md:hidden p-4 border-b" style={{ borderColor: colors.border }}>
              <button 
                className="w-full flex justify-end"
                onClick={() => setShowMobileMenu(false)}
              >
                <FiX className="w-5 h-5" style={{ color: colors.text }} />
              </button>
            </div>
            
            {/* Mobile Search */}
            <div className="md:hidden p-4">
              <div className="relative mb-4">
                <input
                  type="text"
                  placeholder="Search messages..."
                  className="w-full pl-9 pr-4 py-2 rounded-lg border outline-none"
                  style={{
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    color: colors.text
                  }}
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: `${colors.text}80` }} />
              </div>
              
              <button
                className="w-full px-3 py-2 rounded-md flex items-center justify-center gap-1 mb-2"
                style={{ 
                  backgroundColor: colors.primary,
                  color: 'white'
                }}
                onClick={() => {
                  startComposing();
                  router.push('/messages?compose=new');
                  setShowMobileMenu(false);
                }}
              >
                <FiPlus className="w-4 h-4" />
                <span className="font-medium">New Message</span>
              </button>
            </div>
            
            {/* Folders */}
            <div className="p-4">
              <h3 className="text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: `${colors.text}80` }}>
                Folders
              </h3>
              <ul className="space-y-1">
                <li>
                  <button 
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md ${activeFilter === 'all' ? 'font-medium' : ''}`}
                    style={{ 
                      backgroundColor: activeFilter === 'all' ? 
                        (theme === 'light' ? '#F3F4F6' : '#374151') : 'transparent',
                      color: colors.text
                    }}
                    onClick={() => {
                      setActiveFilter('all');
                      setShowMobileMenu(false);
                    }}
                  >
                    <FiInbox className="w-4 h-4" style={{ color: activeFilter === 'all' ? colors.primary : colors.text }} />
                    <span>Inbox</span>
                    {unreadCount > 0 && (
                      <span className="ml-auto px-2 py-0.5 text-xs rounded-full" style={{ 
                        backgroundColor: colors.primary,
                        color: 'white'
                      }}>
                        {unreadCount}
                      </span>
                    )}
                  </button>
                </li>
                <li>
                  <button 
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md ${activeFilter === 'unread' ? 'font-medium' : ''}`}
                    style={{ 
                      backgroundColor: activeFilter === 'unread' ? 
                        (theme === 'light' ? '#F3F4F6' : '#374151') : 'transparent',
                      color: colors.text
                    }}
                    onClick={() => {
                      setActiveFilter('unread');
                      setShowMobileMenu(false);
                    }}
                  >
                    <FiMail className="w-4 h-4" style={{ color: activeFilter === 'unread' ? colors.primary : colors.text }} />
                    <span>Unread</span>
                  </button>
                </li>
                <li>
                  <button 
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md ${activeFilter === 'group' ? 'font-medium' : ''}`}
                    style={{ 
                      backgroundColor: activeFilter === 'group' ? 
                        (theme === 'light' ? '#F3F4F6' : '#374151') : 'transparent',
                      color: colors.text
                    }}
                    onClick={() => {
                      setActiveFilter('group');
                      setShowMobileMenu(false);
                    }}
                  >
                    <FiUsers className="w-4 h-4" style={{ color: activeFilter === 'group' ? colors.primary : colors.text }} />
                    <span>Groups</span>
                  </button>
                </li>
                <li>
                  <button 
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md ${activeFilter === 'archived' ? 'font-medium' : ''}`}
                    style={{ 
                      backgroundColor: activeFilter === 'archived' ? 
                        (theme === 'light' ? '#F3F4F6' : '#374151') : 'transparent',
                      color: colors.text
                    }}
                    onClick={() => {
                      setActiveFilter('archived');
                      setShowMobileMenu(false);
                    }}
                  >
                    <FiArchive className="w-4 h-4" style={{ color: activeFilter === 'archived' ? colors.primary : colors.text }} />
                    <span>Archived</span>
                  </button>
                </li>
              </ul>
            </div>
            
            {/* Contact Types */}
            <div className="p-4 border-t" style={{ borderColor: colors.border }}>
              <h3 className="text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: `${colors.text}80` }}>
                Contact Types
              </h3>
              <ul className="space-y-1">
                <li>
                  <button 
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md ${activeFilter === 'candidate' ? 'font-medium' : ''}`}
                    style={{ 
                      backgroundColor: activeFilter === 'candidate' ? 
                        (theme === 'light' ? '#F3F4F6' : '#374151') : 'transparent',
                      color: colors.text
                    }}
                    onClick={() => {
                      setActiveFilter('candidate');
                      setShowMobileMenu(false);
                    }}
                  >
                    <FiUser className="w-4 h-4" style={{ color: activeFilter === 'candidate' ? colors.primary : colors.text }} />
                    <span>Candidates</span>
                  </button>
                </li>
                <li>
                  <button 
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md ${activeFilter === 'employer' ? 'font-medium' : ''}`}
                    style={{ 
                      backgroundColor: activeFilter === 'employer' ? 
                        (theme === 'light' ? '#F3F4F6' : '#374151') : 'transparent',
                      color: colors.text
                    }}
                    onClick={() => {
                      setActiveFilter('employer');
                      setShowMobileMenu(false);
                    }}
                  >
                    <FiBriefcase className="w-4 h-4" style={{ color: activeFilter === 'employer' ? colors.primary : colors.text }} />
                    <span>Companies</span>
                  </button>
                </li>
                <li>
                  <button 
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md ${activeFilter === 'admin' ? 'font-medium' : ''}`}
                    style={{ 
                      backgroundColor: activeFilter === 'admin' ? 
                        (theme === 'light' ? '#F3F4F6' : '#374151') : 'transparent',
                      color: colors.text
                    }}
                    onClick={() => {
                      setActiveFilter('admin');
                      setShowMobileMenu(false);
                    }}
                  >
                    <FiCheck className="w-4 h-4" style={{ color: activeFilter === 'admin' ? colors.primary : colors.text }} />
                    <span>Team</span>
                  </button>
                </li>
                <li>
                  <button 
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md ${activeFilter === 'consultant' ? 'font-medium' : ''}`}
                    style={{ 
                      backgroundColor: activeFilter === 'consultant' ? 
                        (theme === 'light' ? '#F3F4F6' : '#374151') : 'transparent',
                      color: colors.text
                    }}
                    onClick={() => {
                      setActiveFilter('consultant');
                      setShowMobileMenu(false);
                    }}
                  >
                    <FiCalendar className="w-4 h-4" style={{ color: activeFilter === 'consultant' ? colors.primary : colors.text }} />
                    <span>Consultants</span>
                  </button>
                </li>
              </ul>
            </div>
            
            {/* Labels/Tags section (would connect to a real tag system) */}
            <div className="p-4 border-t" style={{ borderColor: colors.border }}>
              <h3 className="text-xs font-semibold mb-3 uppercase tracking-wider flex items-center justify-between" style={{ color: `${colors.text}80` }}>
                <span>Labels</span>
                <button className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
                  <FiPlus className="w-3.5 h-3.5" style={{ color: `${colors.text}80` }} />
                </button>
              </h3>
              <ul className="space-y-1">
                <li>
                  <button 
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-md"
                    style={{ color: colors.text }}
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <span className="w-3 h-3 rounded-full bg-green-500"></span>
                    <span>Important</span>
                  </button>
                </li>
                <li>
                  <button 
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-md"
                    style={{ color: colors.text }}
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                    <span>Work</span>
                  </button>
                </li>
                <li>
                  <button 
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-md"
                    style={{ color: colors.text }}
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                    <span>Follow-up</span>
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* Conversations List */}
        <div 
          className={`${(window.innerWidth < 768 && (activeConversation || isComposing)) ? 'hidden' : 'block'} md:block w-full md:w-80 flex-shrink-0 border-r flex flex-col`}
          style={{ borderColor: colors.border }}
        >
          {/* Conversations List Header */}
          <div className="p-4 border-b flex justify-between items-center" style={{ borderColor: colors.border }}>
            <h2 className="font-medium" style={{ color: colors.text }}>
              {selectedConversations.length > 0 
                ? `${selectedConversations.length} selected` 
                : activeFilter === 'all' 
                  ? 'All Messages' 
                  : `${activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)}`}
            </h2>
            
            <div className="flex items-center gap-1">
              {selectedConversations.length > 0 ? (
                <>
                  <button
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => setSelectedConversations([])}
                    aria-label="Cancel selection"
                  >
                    <FiX className="w-5 h-5" style={{ color: colors.text }} />
                  </button>
                  <button
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-red-500"
                    onClick={handleBulkDelete}
                    aria-label="Delete selected"
                  >
                    <FiTrash2 className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <>
                  <div className="relative">
                    <button
                      className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                      onClick={() => setShowFilterMenu(!showFilterMenu)}
                      aria-label="Filter"
                    >
                      <FiFilter className="w-5 h-5" style={{ color: colors.text }} />
                    </button>
                    
                    {showFilterMenu && (
                      <div 
                        className="absolute right-0 mt-2 w-48 rounded-md shadow-lg p-2 z-10"
                        style={{ 
                          backgroundColor: colors.card,
                          border: `1px solid ${colors.border}`
                        }}
                      >
                        <div className="py-1">
                          <button
                            className="w-full text-left px-4 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                            style={{ color: colors.text }}
                            onClick={() => {
                              setActiveFilter('all');
                              setShowFilterMenu(false);
                            }}
                          >
                            All Messages
                          </button>
                          <button
                            className="w-full text-left px-4 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                            style={{ color: colors.text }}
                            onClick={() => {
                              setActiveFilter('unread');
                              setShowFilterMenu(false);
                            }}
                          >
                            Unread Only
                          </button>
                          <button
                            className="w-full text-left px-4 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                            style={{ color: colors.text }}
                            onClick={() => {
                              setActiveFilter('starred');
                              setShowFilterMenu(false);
                            }}
                          >
                            Starred
                          </button>
                          <button
                            className="w-full text-left px-4 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                            style={{ color: colors.text }}
                            onClick={() => {
                              setActiveFilter('archived');
                              setShowFilterMenu(false);
                            }}
                          >
                            Archived
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="relative">
                    <button
                      className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                      onClick={() => setShowSortMenu(!showSortMenu)}
                      aria-label="Sort"
                    >
                      <FiChevronDown className="w-5 h-5" style={{ color: colors.text }} />
                    </button>
                    
                    {showSortMenu && (
                      <div 
                        className="absolute right-0 mt-2 w-48 rounded-md shadow-lg p-2 z-10"
                        style={{ 
                          backgroundColor: colors.card,
                          border: `1px solid ${colors.border}`
                        }}
                      >
                        <div className="py-1">
                          <button
                            className="w-full text-left px-4 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                            style={{ color: colors.text }}
                            onClick={() => {
                              setSortBy('recent');
                              setShowSortMenu(false);
                            }}
                          >
                            {sortBy === 'recent' && <span className="mr-2">✓</span>}
                            Most Recent
                          </button>
                          <button
                            className="w-full text-left px-4 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                            style={{ color: colors.text }}
                            onClick={() => {
                              setSortBy('oldest');
                              setShowSortMenu(false);
                            }}
                          >
                            {sortBy === 'oldest' && <span className="mr-2">✓</span>}
                            Oldest First
                          </button>
                          <button
                            className="w-full text-left px-4 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                            style={{ color: colors.text }}
                            onClick={() => {
                              setSortBy('name');
                              setShowSortMenu(false);
                            }}
                          >
                            {sortBy === 'name' && <span className="mr-2">✓</span>}
                            By Name (A-Z)
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <button
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={handleSelectAll}
                    aria-label="Select all"
                  >
                    <FiSquare className="w-5 h-5" style={{ color: colors.text }} />
                  </button>
                </>
              )}
            </div>
          </div>
          
          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {isLoadingConversations && filteredConversations.length === 0 ? (
              <div className="flex justify-center items-center h-full">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 border-2 border-t-primary rounded-full animate-spin mb-3"
                    style={{ borderColor: `${colors.border}`, borderTopColor: colors.primary }}
                  />
                  <p style={{ color: colors.text }}>Loading conversations...</p>
                </div>
              </div>
            ) : conversationsError ? (
              <div className="flex justify-center items-center h-full">
                <div className="text-center p-4">
                  <p className="text-red-500 dark:text-red-400 mb-2">Error loading conversations</p>
                  <p style={{ color: `${colors.text}80` }}>
                    {conversationsError.includes('mock') ? 'Using mock data due to API issues' : 'Please try again later'}
                  </p>
                  <button
                    className="mt-3 px-4 py-2 rounded-md text-sm"
                    style={{ backgroundColor: colors.primary, color: 'white' }}
                    onClick={() => fetchConversations("7")}
                  >
                    Retry
                  </button>
                </div>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-4">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                  style={{ backgroundColor: theme === 'light' ? '#F1F5F9' : '#1E293B' }}
                >
                  <FiInbox className="w-8 h-8" style={{ color: colors.primary }} />
                </div>
                <h3 className="text-lg font-medium mb-2" style={{ color: colors.text }}>No messages found</h3>
                <p className="text-center mb-4" style={{ color: `${colors.text}80` }}>
                  {searchTerm 
                    ? `No messages matching "${searchTerm}"` 
                    : `No ${activeFilter !== 'all' ? activeFilter : ''} messages to display`}
                </p>
                <button
                  className="px-4 py-2 rounded-md"
                  style={{ 
                    backgroundColor: colors.primary,
                    color: 'white'
                  }}
                  onClick={() => {
                    startComposing();
                    router.push('/messages?compose=new');
                  }}
                >
                  Start a new conversation
                </button>
              </div>
            ) : (
              <div>
                {filteredConversations.map((conversation) => {
                  const isSelected = selectedConversations.includes(conversation.id);
                  const isActive = activeConversation?.id === conversation.id;
                  const hasUnread = conversation.unread_count > 0;
                  const participant = conversation.participants[0] || {
                    id: 'unknown',
                    name: 'Unknown',
                    type: 'unknown',
                    avatar: null
                  };
                  
                  return (
                    <div 
                      key={conversation.id}
                      className={`border-b px-4 py-3 flex items-center gap-3 cursor-pointer ${
                        isActive ? (theme === 'light' ? 'bg-blue-50' : 'bg-blue-900/20') : ''
                      } hover:${theme === 'light' ? 'bg-gray-50' : 'bg-gray-800'}`}
                      style={{ borderColor: colors.border }}
                      onClick={() => handleConversationClick(conversation)}
                    >
                      <div className="flex-shrink-0">
                        {selectedConversations.length > 0 ? (
                          <div 
                            className={`w-10 h-10 rounded-md border-2 flex items-center justify-center`}
                            style={{
                              borderColor: isSelected ? colors.primary : colors.border,
                              backgroundColor: isSelected ? `${colors.primary}30` : 'transparent'
                            }}
                          >
                            {isSelected && <FiCheck className="w-5 h-5" style={{ color: colors.primary }} />}
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-full overflow-hidden">
                            {getParticipantAvatar(participant)}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline">
                          <h3 
                            className={`font-medium truncate ${hasUnread ? 'font-semibold' : ''}`}
                            style={{ color: colors.text }}
                          >
                            {conversation.title || participant.name || 'Conversation'}
                            {conversation.type === 'group' && (
                              <span className="ml-1 text-xs font-normal" style={{ color: `${colors.text}70` }}>
                                ({conversation.participants.length})
                              </span>
                            )}
                          </h3>
                          <span className="text-xs whitespace-nowrap" style={{ color: hasUnread ? colors.primary : `${colors.text}70` }}>
                            {conversation.updated_at && formatConversationTime(conversation.updated_at)}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center mt-1">
                          <p 
                            className={`text-sm truncate ${hasUnread ? 'font-medium' : ''}`}
                            style={{ color: hasUnread ? colors.text : `${colors.text}70` }}
                          >
                            {conversation.last_message?.content 
                              ? getTruncatedPreview(conversation.last_message.content)
                              : 'No messages yet'}
                          </p>
                          
                          <div className="flex items-center gap-1 ml-2">
                            {conversation.is_starred && (
                              <FiStar className="w-4 h-4 text-yellow-400" />
                            )}
                            
                            {hasUnread && (
                              <div 
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: colors.primary }}
                              ></div>
                            )}
                            
                            {conversation.has_attachments && (
                              <FiPaperclip className="w-3.5 h-3.5" style={{ color: `${colors.text}70` }} />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        
        {/* Conversation View / Message Content */}
        <div className={`${(window.innerWidth < 768 && !(activeConversation || isComposing)) ? 'hidden' : 'flex'} flex-1 flex flex-col overflow-hidden ${showContactDetails ? 'contact-details-open' : ''}`}>
          {/* Conversation Header */}
          {activeConversation && !isComposing && (
            <div 
              className="hidden md:flex px-4 py-3 items-center justify-between border-b"
              style={{ borderColor: colors.border }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden">
                  {activeConversation.participants.length > 0 && activeConversation.participants[0] && 
                    getParticipantAvatar(activeConversation.participants[0])}
                </div>
                <div>
                  <h1 className="font-medium" style={{ color: colors.text }}>
                    {activeConversation.title || 
                      (activeConversation.participants.length > 0 ? 
                      activeConversation.participants[0].name : 'Conversation')}
                  </h1>
                  <p className="text-xs" style={{ color: `${colors.text}80` }}>
                    {activeConversation.type === 'group' 
                      ? `${activeConversation.participants.length} participants`
                      : 'Active now'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <button
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                  aria-label="Mark as starred"
                >
                  <FiStar className="w-5 h-5" style={{ color: colors.text }} />
                </button>
                <button
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                  aria-label="Call"
                >
                  <FiPhone className="w-5 h-5" style={{ color: colors.text }} />
                </button>
                <button
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                  aria-label="Video call"
                >
                  <FiVideo className="w-5 h-5" style={{ color: colors.text }} />
                </button>
                <button
                  className={`p-2 rounded-full ${showContactDetails ? 'bg-gray-100 dark:bg-gray-800' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                  onClick={toggleContactDetails}
                  aria-label="Contact info"
                >
                  <FiInfo className="w-5 h-5" style={{ color: showContactDetails ? colors.primary : colors.text }} />
                </button>
                <button
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                  aria-label="More options"
                >
                  <FiMoreVertical className="w-5 h-5" style={{ color: colors.text }} />
                </button>
              </div>
            </div>
          )}
          
          {/* Compose Header for Desktop */}
          {isComposing && (
            <div 
              className="hidden md:flex px-4 py-3 items-center justify-between border-b"
              style={{ borderColor: colors.border }}
            >
              <div>
                <h1 className="font-medium" style={{ color: colors.text }}>
                  New Message
                </h1>
                <p className="text-xs" style={{ color: `${colors.text}80` }}>
                  Select recipients to start a conversation
                </p>
              </div>
              
              <button
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={cancelComposing}
                aria-label="Cancel"
              >
                <FiX className="w-5 h-5" style={{ color: colors.text }} />
              </button>
            </div>
          )}
          
          {/* Message Content Area */}
          <div className="flex-1 flex flex-col relative">
            {isComposing ? (
              <div className="p-4">
                <h2 className="text-sm font-medium mb-2" style={{ color: colors.text }}>To:</h2>
                <RecipientSelector
                  selectedRecipients={selectedRecipients}
                  onAddRecipient={selectRecipient}
                  onRemoveRecipient={removeRecipient}
                  placeholder="Search for people or teams..."
                />
              </div>
            ) : null}
            
            {/* Messages container */}
            <div 
              className="flex-1 overflow-y-auto p-4 space-y-4"
              onScroll={handleScroll}
            >
              {isLoadingMessages && messages.length === 0 ? (
                <div className="flex justify-center items-center h-full">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 border-2 border-t-primary rounded-full animate-spin mb-3"
                      style={{ borderColor: `${colors.border}`, borderTopColor: colors.primary }}
                    />
                    <p style={{ color: colors.text }}>Loading messages...</p>
                  </div>
                </div>
              ) : messagesError ? (
                <div className="flex justify-center items-center h-full">
                  <div className="text-center p-4">
                    <p className="text-red-500 dark:text-red-400 mb-2">Error loading messages</p>
                    <p style={{ color: `${colors.text}80` }}>
                      {messagesError.includes('mock') ? 'Using mock data due to API issues' : 'Please try again later'}
                    </p>
                    <button
                      className="mt-3 px-4 py-2 rounded-md text-sm"
                      style={{ backgroundColor: colors.primary, color: 'white' }}
                      onClick={() => activeConversation && fetchMessages(activeConversation.id)}
                    >
                      Retry
                    </button>
                  </div>
                </div>
              ) : !activeConversation && !isComposing ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <div 
                    className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
                    style={{ backgroundColor: theme === 'light' ? '#F1F5F9' : '#1E293B' }}
                  >
                    <FiMessageCircle className="w-12 h-12" style={{ color: colors.primary }} />
                  </div>
                  <h3 className="text-xl font-medium mb-3" style={{ color: colors.text }}>Your Messages</h3>
                  <p className="text-center mb-6 max-w-md" style={{ color: `${colors.text}80` }}>
                    Select a conversation from the list or start a new one to begin messaging
                  </p>
                  <button
                    className="px-4 py-2 rounded-md flex items-center gap-2"
                    style={{ 
                      backgroundColor: colors.primary,
                      color: 'white'
                    }}
                    onClick={() => {
                      startComposing();
                      router.push('/messages?compose=new');
                    }}
                  >
                    <FiPlus className="w-5 h-5" />
                    <span>New Message</span>
                  </button>
                </div>
              ) : messages.length === 0 && !isComposing ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                    style={{ backgroundColor: theme === 'light' ? '#F1F5F9' : '#1E293B' }}
                  >
                    <FiMessageCircle className="w-8 h-8" style={{ color: colors.primary }} />
                  </div>
                  <h3 className="text-lg font-medium mb-2" style={{ color: colors.text }}>No messages yet</h3>
                  <p className="text-center mb-4" style={{ color: `${colors.text}80` }}>
                    Start the conversation by sending a message below
                  </p>
                </div>
              ) : (
                // Group messages by date
                groupMessagesByDate().map(group => (
                  <div key={group.date} className="space-y-4">
                    {/* Date header */}
                    <div className="flex justify-center">
                      <div 
                        className="px-3 py-1 rounded-full text-xs"
                        style={{ 
                          backgroundColor: theme === 'light' ? '#F1F5F9' : '#1E293B',
                          color: `${colors.text}80`
                        }}
                      >
                        {formatDateHeader(group.date)}
                      </div>
                    </div>
                    
                    {/* Messages for this date */}
                    {group.messages.map((message, index) => {
                      // Check if this is a new sender compared to previous message
                      const prevMessage = index > 0 ? group.messages[index - 1] : null;
                      const isNewSender = !prevMessage || prevMessage.sender.id !== message.sender.id;
                      
                      // Check if this is the last message from this sender
                      const nextMessage = index < group.messages.length - 1 ? group.messages[index + 1] : null;
                      const isLastFromSender = !nextMessage || nextMessage.sender.id !== message.sender.id;
                      
                      // Check if this message is from current user (update this to match your auth)
                      const isYou = message.sender.id === '7';
                      
                      return (
                        <div 
                          key={message.id}
                          className={`flex ${isYou ? 'justify-end' : 'justify-start'}`}
                          onMouseEnter={() => handleMessageInView(message.id)}
                        >
                          <div className={`flex ${isYou ? 'flex-row-reverse' : 'flex-row'} max-w-[80%]`}>
                            {/* Avatar - only show for first message in a group */}
                            {isNewSender && !isYou && (
                              <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 mt-1">
                                {getParticipantAvatar(message.sender)}
                              </div>
                            )}
                            
                            <div 
                              className={`flex flex-col mx-2 ${isNewSender ? '' : isYou ? 'mr-9' : 'ml-9'}`}
                            >
                              {/* Sender name - only show for first message in a group */}
                              {isNewSender && !isYou && (
                                <div className="text-xs font-medium ml-1 mb-1" style={{ color: colors.text }}>
                                  {message.sender.name}
                                </div>
                              )}
                              
                              {/* Message bubble */}
                              <div
                                className={`p-3 rounded-lg shadow-sm ${isYou ? 'rounded-tr-none' : 'rounded-tl-none'}`}
                                style={{ 
                                  backgroundColor: isYou 
                                    ? colors.primary 
                                    : theme === 'light' ? '#F1F5F9' : '#1E293B',
                                  color: isYou ? 'white' : colors.text
                                }}
                              >
                                {/* Message content */}
                                <div className="whitespace-pre-wrap break-words">
                                  {message.content}
                                </div>
                                
                                {/* Attachments */}
                                {message.attachments && message.attachments.length > 0 && (
                                  <div className="mt-2">
                                    {message.attachments.map(attachment => renderAttachment(attachment))}
                                  </div>
                                )}
                                
                                {/* Entity references */}
                                {message.entity_references && message.entity_references.length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {message.entity_references.map(entity => (
                                      <div
                                        key={`${entity.type}-${entity.id}`}
                                        className={`px-2 py-1 rounded-md text-xs flex items-center gap-1`}
                                        style={{
                                          backgroundColor: isYou 
                                            ? 'rgba(255, 255, 255, 0.2)' 
                                            : theme === 'light' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.1)',
                                          color: isYou ? 'white' : colors.text
                                        }}
                                      >
                                        {entity.type === 'job' && <FiBriefcase className="w-3.5 h-3.5" />}
                                        {entity.type === 'candidate' && <FiUser className="w-3.5 h-3.5" />}
                                        {entity.type === 'company' && <FiBriefcase className="w-3.5 h-3.5" />}
                                        {entity.name}
                                      </div>
                                    ))}
                                  </div>
                                )}
                                
                                {/* Time and status - only show for last message in a group */}
                                {isLastFromSender && (
                                  <div 
                                    className={`text-[10px] mt-1 flex items-center gap-1 ${isYou ? 'justify-end' : 'justify-start'}`}
                                    style={{ color: isYou ? 'rgba(255, 255, 255, 0.8)' : `${colors.text}70` }}
                                  >
                                    <span>{formatMessageTime(message.created_at)}</span>
                                    {isYou && renderMessageStatus(message.status)}
                                  </div>
                                )}
                              </div>
                              
                              {/* Message Actions - only visible on hover */}
                              <div className={`opacity-0 hover:opacity-100 transition-opacity flex items-center gap-1 mt-1 ${isYou ? 'justify-end' : 'justify-start'}`}>
                                <button 
                                  className="p-1 rounded-full"
                                  style={{ 
                                    backgroundColor: theme === 'light' ? '#F1F5F9' : '#1E293B',
                                    color: `${colors.text}70`
                                  }}
                                  aria-label="Reply"
                                >
                                  <FiCornerDownLeft className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  className="p-1 rounded-full"
                                  style={{ 
                                    backgroundColor: theme === 'light' ? '#F1F5F9' : '#1E293B',
                                    color: `${colors.text}70`
                                  }}
                                  aria-label="Forward"
                                >
                                  <FiSend className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  className="p-1 rounded-full"
                                  style={{ 
                                    backgroundColor: theme === 'light' ? '#F1F5F9' : '#1E293B',
                                    color: `${colors.text}70`
                                  }}
                                  aria-label="More options"
                                >
                                  <FiMoreVertical className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
              
              {/* Element for scrolling to the end of messages */}
              <div ref={messagesEndRef} />
              
              {/* New messages indicator */}
              {unreadIndicatorVisible && (
                <div 
                  className="fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-primary text-white px-4 py-2 rounded-full shadow-lg cursor-pointer z-10"
                  onClick={() => {
                    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                    setUnreadIndicatorVisible(false);
                  }}
                >
                  New messages
                </div>
              )}
            </div>
            
            {/* Message composer */}
            <div className="border-t" style={{ borderColor: colors.border }}>
              <MessageComposer 
                disabled={isComposing && selectedRecipients.length === 0}
                placeholder={isComposing && selectedRecipients.length === 0 
                  ? "Select recipients to start typing..." 
                  : "Type a message..."}
                conversationId={activeConversation?.id}
                onSendMessage={handleSendMessage}
              />
            </div>
          </div>
        </div>
        
        {/* Contact details sidebar - hidden on mobile unless showContactDetails is true */}
        {showContactDetails && activeConversation && (
          <div 
            className="w-full md:w-80 border-l flex-shrink-0 overflow-y-auto"
            style={{ borderColor: colors.border }}
          >
            <div>
              {/* Contact header */}
              <div className="p-4 flex flex-col items-center border-b" style={{ borderColor: colors.border }}>
                <div className="w-20 h-20 rounded-full overflow-hidden mb-3">
                  {activeConversation.participants[0] && 
                    getParticipantAvatar(activeConversation.participants[0])}
                </div>
                <h2 className="text-lg font-medium" style={{ color: colors.text }}>
                  {activeConversation.title || 
                    (activeConversation.participants.length > 0 ? 
                    activeConversation.participants[0].name : 'Conversation')}
                </h2>
                <p className="text-sm" style={{ color: `${colors.text}80` }}>
                  {activeConversation.type === 'group' 
                    ? `${activeConversation.participants.length} participants` 
                    : activeConversation.participants[0]?.type || ''}
                </p>
                <div className="flex gap-4 mt-3">
                  <button
                    className="flex flex-col items-center"
                    aria-label="Call"
                  >
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center mb-1"
                      style={{ backgroundColor: theme === 'light' ? '#F1F5F9' : '#1E293B' }}
                    >
                      <FiPhone className="w-5 h-5" style={{ color: colors.text }} />
                    </div>
                    <span className="text-xs" style={{ color: colors.text }}>Call</span>
                  </button>
                  <button
                    className="flex flex-col items-center"
                    aria-label="Video"
                  >
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center mb-1"
                      style={{ backgroundColor: theme === 'light' ? '#F1F5F9' : '#1E293B' }}
                    >
                      <FiVideo className="w-5 h-5" style={{ color: colors.text }} />
                    </div>
                    <span className="text-xs" style={{ color: colors.text }}>Video</span>
                  </button>
                  <button
                    className="flex flex-col items-center"
                    aria-label="Star"
                  >
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center mb-1"
                      style={{ backgroundColor: theme === 'light' ? '#F1F5F9' : '#1E293B' }}
                    >
                      <FiStar className="w-5 h-5" style={{ color: colors.text }} />
                    </div>
                    <span className="text-xs" style={{ color: colors.text }}>Star</span>
                  </button>
                </div>
              </div>
              
              {/* Associated entities */}
              {activeConversation?.associated_entities && activeConversation.associated_entities.length > 0 && (
                <div className="p-4 border-b" style={{ borderColor: colors.border }}>
                  <h3 className="text-sm font-medium mb-3" style={{ color: colors.text }}>
                    Related Information
                  </h3>
                  {activeConversation.associated_entities.map(entity => (
                    <div 
                      key={`${entity.type}-${entity.id}`}
                      className="p-3 rounded-lg mb-2 flex items-center gap-3"
                      style={{ backgroundColor: theme === 'light' ? '#F1F5F9' : '#1E293B' }}
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: theme === 'light' ? '#E2E8F0' : '#334155' }}
                      >
                        {entity.type === 'job' && <FiBriefcase className="w-5 h-5" style={{ color: theme === 'light' ? '#64748B' : '#94A3B8' }} />}
                        {entity.type === 'candidate' && <FiUser className="w-5 h-5" style={{ color: theme === 'light' ? '#64748B' : '#94A3B8' }} />}
                        {entity.type === 'company' && <FiBriefcase className="w-5 h-5" style={{ color: theme === 'light' ? '#64748B' : '#94A3B8' }} />}
                      </div>
                      <div>
                        <div className="text-sm font-medium" style={{ color: colors.text }}>{entity.name}</div>
                        <div className="text-xs capitalize" style={{ color: `${colors.text}80` }}>{entity.type}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Shared files */}
              <div className="p-4 border-b" style={{ borderColor: colors.border }}>
                <h3 className="text-sm font-medium mb-3 flex items-center justify-between" style={{ color: colors.text }}>
                  <span>Shared Files</span>
                  <button
                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-xs"
                    style={{ color: colors.primary }}
                  >
                    View All
                  </button>
                </h3>
                <div className="space-y-2">
                  {messages
                    .filter(m => m.attachments && m.attachments.length > 0)
                    .flatMap(m => m.attachments)
                    .slice(0, 3)
                    .map(attachment => (
                      <div 
                        key={attachment.id}
                        className="p-3 rounded-lg flex items-center gap-3"
                        style={{ backgroundColor: theme === 'light' ? '#F1F5F9' : '#1E293B' }}
                      >
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gray-300 dark:bg-gray-700">
                          <FiFile className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <div className="text-sm font-medium truncate" style={{ color: colors.text }}>
                            {attachment.name}
                          </div>
                          <div className="text-xs" style={{ color: `${colors.text}80` }}>
                            {(attachment.file_size / 1024).toFixed(0)} KB
                          </div>
                        </div>
                      </div>
                    ))}
                  
                  {messages.filter(m => m.attachments && m.attachments.length > 0).length === 0 && (
                    <div className="text-center py-3" style={{ color: `${colors.text}60` }}>
                      <FiPaperclip className="w-5 h-5 mx-auto mb-2" />
                      <p className="text-sm">No files shared yet</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Participants section for group chats */}
              {activeConversation.type === 'group' && (
                <div className="p-4">
                  <h3 className="text-sm font-medium mb-3 flex items-center justify-between" style={{ color: colors.text }}>
                    <span>Participants ({activeConversation.participants.length})</span>
                    <button
                      className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-xs"
                      style={{ color: colors.primary }}
                    >
                      Add
                    </button>
                  </h3>
                  <div className="space-y-3">
                    {activeConversation.participants.map(participant => (
                      <div 
                        key={participant.id}
                        className="flex items-center gap-3"
                      >
                        <div className="w-8 h-8 rounded-full overflow-hidden">
                          {getParticipantAvatar(participant)}
                        </div>
                        <div>
                          <div className="text-sm font-medium" style={{ color: colors.text }}>
                            {participant.name}
                          </div>
                          <div className="text-xs capitalize" style={{ color: `${colors.text}80` }}>
                            {participant.type}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Actions section */}
              <div className="p-4 border-t" style={{ borderColor: colors.border }}>
                <button
                  className="w-full p-3 rounded-md flex items-center gap-3"
                  style={{ 
                    backgroundColor: theme === 'light' ? '#F1F5F9' : '#1E293B',
                    color: colors.text
                  }}
                >
                  <FiFlag className="w-5 h-5" style={{ color: 'red' }} />
                  <span>Report or Block</span>
                </button>
                <button
                  className="w-full mt-2 p-3 rounded-md flex items-center gap-3"
                  style={{ 
                    backgroundColor: theme === 'light' ? '#F1F5F9' : '#1E293B',
                    color: colors.text
                  }}
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete this conversation?')) {
                      deleteConversation(activeConversation.id);
                      setActiveConversation(null);
                      router.push('/messages');
                      toggleContactDetails();
                    }
                  }}
                >
                  <FiTrash2 className="w-5 h-5" style={{ color: 'red' }} />
                  <span>Delete Conversation</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Needed for the checkbox functionality in conversation selection
const FiSquare: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
    style={style}
  >
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
  </svg>
);

export default MessagingPage;