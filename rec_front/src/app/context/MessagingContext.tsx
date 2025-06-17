// 'use client';

// import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
// import { useDataStore } from '@/store/useDataStore';
// import { useAuthStore, selectUser } from '@/store/useAuthStore';
// import {
//   CreateMessageDto,
//   CreateConversationDto,
//   UIParticipant,
//   UIConversation,
//   UIMessage,
//   Attachment,
//   ParticipantRole
// } from '@/types/messaging';

// interface MessagingContextType {
//   // Data
//   conversations: UIConversation[];
//   activeConversation: UIConversation | null;
//   messages: UIMessage[];
//   selectedRecipients: UIParticipant[];
//   unreadMessageCount: number;
//   searchTerm: string;
//   activeFilter: string;
//   filteredConversations: UIConversation[];
//   isMobileView: boolean;
//   showContactDetails: boolean;
//   isComposing: boolean;
//   draftMessage: string;
  
//   // Loading states
//   isLoadingConversations: boolean;
//   isLoadingMessages: boolean;
//   isSendingMessage: boolean;
  
//   // Error states
//   conversationsError: string | null;
//   messagesError: string | null;
  
//   // Actions
//   fetchConversations: () => Promise<void>;
//   fetchConversation: (conversationId: number) => Promise<void>;
//   fetchMessages: (conversationId?: number) => Promise<void>;
//   sendMessage: (content: string, attachments?: Attachment[]) => Promise<void>;
//   searchConversations: (term: string) => void;
//   filterConversations: (filter: string) => void;
//   markAsRead: (messageId: number) => Promise<void>;
//   createConversation: (recipients: UIParticipant[], content: string) => Promise<void>;
//   setActiveConversation: (conversation: UIConversation | null) => void;
//   toggleContactDetails: () => void;
//   startComposeNew: () => void;
//   cancelComposeNew: () => void;
//   addRecipient: (recipient: UIParticipant) => void;
//   removeRecipient: (recipientId: string) => void;
//   updateDraftMessage: (content: string) => void;
//   fetchUnreadCount: () => Promise<void>;
//   selectConversation: (conversation: UIConversation) => Promise<void>;
// }

// const MessagingContext = createContext<MessagingContextType | undefined>(undefined);

// export const MessagingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//   const {
//     uiConversations,
//     filteredConversations: storeFilteredConversations,
//     activeConversation,
//     uiMessages,
//     unreadMessageCount: storeUnreadCount,
//     isLoadingConversations,
//     isLoadingMessages,
//     isSendingMessage,
//     conversationsError,
//     messagesError,
//     messagingUI,
//     fetchConversations: storeFetchConversations,
//     fetchConversation: storeFetchConversation,
//     fetchMessages: storeFetchMessages,
//     sendMessage: storeSendMessage,
//     createConversation: storeCreateConversation,
//     markMessageAsRead: storeMarkMessageAsRead,
//     fetchUnreadCount: storeFetchUnreadCount,
//     setActiveConversation: storeSetActiveConversation,
//     searchConversations: storeSearchConversations,
//     filterConversations: storeFilterConversations,
//     toggleContactDetails: storeToggleContactDetails,
//     startComposeNew: storeStartComposeNew,
//     cancelComposeNew: storeCancelComposeNew,
//     addRecipient: storeAddRecipient,
//     removeRecipient: storeRemoveRecipient,
//     updateDraftMessage: storeUpdateDraftMessage,
//     setIsMobileView
//   } = useDataStore();

//   const user = useAuthStore(selectUser);
  
//   // Local state mirrors
//   const [conversations, setConversations] = useState<UIConversation[]>([]);
//   const [messages, setMessages] = useState<UIMessage[]>([]);
//   const [filteredConversations, setFilteredConversations] = useState<UIConversation[]>([]);
//   const [unreadMessageCount, setUnreadMessageCount] = useState(0);

//   // Update mobile view status based on screen size
//   useEffect(() => {
//     const handleResize = () => {
//       setIsMobileView(window.innerWidth < 768);
//     };
    
//     // Set initial value
//     handleResize();
    
//     // Add event listener
//     window.addEventListener('resize', handleResize);
    
//     // Clean up
//     return () => {
//       window.removeEventListener('resize', handleResize);
//     };
//   }, [setIsMobileView]);
  
//   // Update local state when store changes
//   useEffect(() => {
//     setConversations(uiConversations);
//   }, [uiConversations]);

//   useEffect(() => {
//     setFilteredConversations(storeFilteredConversations);
//   }, [storeFilteredConversations]);
  
//   // Update messages when store changes
//   useEffect(() => {
//     setMessages(uiMessages);
//   }, [uiMessages]);
  
//   // Update unread count when store changes
//   useEffect(() => {
//     setUnreadMessageCount(storeUnreadCount);
//   }, [storeUnreadCount]);
  
//   // Fetch conversations when user changes
//   useEffect(() => {
//     if (user) {
//       fetchConversations();
//       fetchUnreadCount();
//     }
//   }, [user]);

//   // Wrapped functions that use the user id from auth context
//   const fetchConversations = useCallback(async () => {
//     if (!user) return;
//     await storeFetchConversations(user.id);
//   }, [user, storeFetchConversations]);

//   const fetchConversation = useCallback(async (conversationId: number) => {
//     await storeFetchConversation(conversationId.toString());
//   }, [storeFetchConversation]);

//   const fetchMessages = useCallback(async (conversationId?: number) => {
//     if (!user) return;

//     const params: { conversation_id?: string; user_id?: string } = {
//       user_id: user.id
//     };

//     if (conversationId) {
//       params.conversation_id = conversationId.toString();
//     }

//     await storeFetchMessages(params);
//   }, [user, storeFetchMessages]);

//   const sendMessage = useCallback(async (content: string, attachments?: Attachment[]) => {
//     if (!user || !activeConversation) throw new Error('User not authenticated or no active conversation');
    
//     const messageData: CreateMessageDto = {
//       conversation_id: activeConversation.id,
//       sender_id: 7, // Fixed admin ID from sample data
//       content
//     };
    
//     // Add attachments if provided
//     if (attachments && attachments.length > 0) {
//       messageData.attachments = attachments.map(a => ({
//         file_name: a.name,
//         file_size: a.size,
//         file_type: a.mimeType || '',
//         storage_path: a.url
//       }));
//     }
    
//     await storeSendMessage(messageData);
//   }, [user, activeConversation, storeSendMessage]);
  
//   const createConversation = useCallback(async (
//     recipients: UIParticipant[],
//     content: string
//   ) => {
//     if (!user) throw new Error('User not authenticated');
    
//     // Create title from recipient names
//     const recipientNames = recipients.map(r => r.name).join(', ');
//     const title = recipients.length > 1 ? `Group: ${recipientNames}` : recipientNames;
    
//     // Create participant objects for the API
//     // Always use admin user ID 7 from sample data
//     const participants = [
//       {
//         user_id: 7, // Fixed admin ID from sample data
//         role: ParticipantRole.ADMIN
//       },
//       ...recipients.map(r => ({
//         user_id: parseInt(r.id),
//         role: ParticipantRole.MEMBER
//       }))
//     ];
    
//     // Create conversation data
//     const conversationData: CreateConversationDto = {
//       title,
//       is_group: recipients.length > 1,
//       participants
//     };
    
//     // Create the conversation
//     const conversation = await storeCreateConversation(conversationData);
    
//     // If content is provided, send an initial message
//     if (content.trim()) {
//       const messageData: CreateMessageDto = {
//         conversation_id: conversation.id,
//         sender_id: 7, // Fixed admin ID from sample data
//         content
//       };
      
//       await storeSendMessage(messageData);
//     }
//   }, [user, storeCreateConversation, storeSendMessage]);
  
//   const markAsRead = useCallback(async (messageId: number) => {
//     if (!user) return;
//     await storeMarkMessageAsRead(messageId.toString(), user.id);
//   }, [user, storeMarkMessageAsRead]);

//   const fetchUnreadCount = useCallback(async () => {
//     if (!user) return;
//     await storeFetchUnreadCount(user.id);
//   }, [user, storeFetchUnreadCount]);

//   const selectConversation = useCallback(async (conversation: UIConversation) => {
//     await fetchConversation(conversation.id);
//     storeSetActiveConversation(conversation);
//   }, [fetchConversation, storeSetActiveConversation]);

//   return (
//     <MessagingContext.Provider
//       value={{
//         conversations,
//         activeConversation,
//         messages,
//         selectedRecipients: messagingUI.selectedRecipients,
//         unreadMessageCount,
//         searchTerm: messagingUI.searchTerm,
//         activeFilter: messagingUI.activeFilter,
//         filteredConversations,
//         isMobileView: messagingUI.isMobileView,
//         showContactDetails: messagingUI.showContactDetails,
//         isComposing: messagingUI.isComposing,
//         draftMessage: messagingUI.draftMessage,
//         isLoadingConversations,
//         isLoadingMessages,
//         isSendingMessage,
//         conversationsError,
//         messagesError,
//         fetchConversations,
//         fetchConversation,
//         fetchMessages,
//         sendMessage,
//         searchConversations: storeSearchConversations,
//         filterConversations: storeFilterConversations,
//         markAsRead,
//         createConversation,
//         setActiveConversation: storeSetActiveConversation,
//         toggleContactDetails: storeToggleContactDetails,
//         startComposeNew: storeStartComposeNew,
//         cancelComposeNew: storeCancelComposeNew,
//         addRecipient: storeAddRecipient,
//         removeRecipient: storeRemoveRecipient,
//         updateDraftMessage: storeUpdateDraftMessage,
//         fetchUnreadCount,
//         selectConversation
//       }}
//     >
//       {children}
//     </MessagingContext.Provider>
//   );
// };

// export const useMessaging = () => {
//   const context = useContext(MessagingContext);
//   if (context === undefined) {
//     throw new Error('useMessaging must be used within a MessagingProvider');
//   }
//   return context;
// };