// src/stores/useMessagingStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import messagesService from '@/services/api/messages-service';
import { 
  Conversation, 
  Message, 
  Participant, 
  MessageStatus,
  CreateMessageDto,
  CreateConversationDto,
  EntityReference,
  MessageAttachment,
  MessageTemplate,
  UIConversation,
  UIMessage
} from '@/types';

interface MessagingState {
  // Data
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Message[];
  messageTemplates: MessageTemplate[];
  attachments: MessageAttachment[];
  suggestedRecipients: Participant[];
  
  // UI State
  searchTerm: string;
  activeFilter: string;
  filteredConversations: Conversation[];
  showContactDetails: boolean;
  isComposing: boolean;
  selectedRecipients: Participant[];
  draftMessage: string;
  unreadCount: number;
  
  // Loading States
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  isLoadingTemplates: boolean;
  isLoadingRecipients: boolean;
  isSendingMessage: boolean;
  isUploadingAttachment: boolean;
  
  // Error States
  conversationsError: string | null;
  messagesError: string | null;
  templatesError: string | null;
  recipientsError: string | null;
  sendError: string | null;
  uploadError: string | null;
  
  // Core Methods - Backend Communication
  fetchConversations: (userId: string, page?: number, limit?: number) => Promise<void>;
  fetchConversation: (conversationId: string) => Promise<Conversation | null>;
  fetchMessages: (conversationId: string, page?: number, limit?: number) => Promise<Message[]>;
  fetchMessageTemplates: (category?: string) => Promise<MessageTemplate[]>;
  fetchAvailableRecipients: () => Promise<void>;
  sendMessage: (message: CreateMessageDto) => Promise<void>;
  createConversation: (data: CreateConversationDto) => Promise<string | null>; // Returns new conversation ID
  markMessagesAsRead: (messageIds: string[]) => Promise<void>;
  fetchUnreadCount: (userId: string) => Promise<void>;
  uploadAttachment: (file: File) => Promise<MessageAttachment | null>;
  deleteConversation: (conversationId: string) => Promise<boolean>;
  
  // UI Methods
  setActiveConversation: (conversation: Conversation | null) => void;
  setSearchTerm: (term: string) => void;
  setActiveFilter: (filter: string) => void;
  toggleContactDetails: () => void;
  startComposing: () => void;
  cancelComposing: () => void;
  selectRecipient: (recipient: Participant) => void;
  removeRecipient: (recipientId: string) => void;
  updateDraftMessage: (content: string) => void;
  clearAttachments: () => void;
  removeAttachment: (id: string) => void;
  filterConversations: () => void;
  resetErrors: () => void;
}

const useMessagingStore = create<MessagingState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        conversations: [],
        activeConversation: null,
        messages: [],
        messageTemplates: [],
        attachments: [],
        suggestedRecipients: [],
        
        searchTerm: '',
        activeFilter: 'all',
        filteredConversations: [],
        showContactDetails: false,
        isComposing: false,
        selectedRecipients: [],
        draftMessage: '',
        unreadCount: 0,
        
        isLoadingConversations: false,
        isLoadingMessages: false,
        isLoadingTemplates: false,
        isLoadingRecipients: false,
        isSendingMessage: false,
        isUploadingAttachment: false,
        
        conversationsError: null,
        messagesError: null,
        templatesError: null,
        recipientsError: null,
        sendError: null,
        uploadError: null,
        
        // Core API methods
        fetchConversations: async (userId: string, page = 1, limit = 20) => {
          const state = get();
          if (state.isLoadingConversations) return;
          
          set({ isLoadingConversations: true, conversationsError: null });
          
          try {
            const skip = (page - 1) * limit;
            const conversations = await messagesService.getConversations(userId, skip, limit);
            
            set({ 
              conversations, 
              filteredConversations: conversations,
              isLoadingConversations: false 
            });
            
            // Apply any active filters
            get().filterConversations();
          } catch (error) {
            console.error('Error fetching conversations:', error);
            set({ 
              isLoadingConversations: false, 
              conversationsError: error instanceof Error ? error.message : 'Failed to fetch conversations'
            });
          }
        },
        
        fetchConversation: async (conversationId: string) => {
          set({ isLoadingConversations: true, conversationsError: null });
          
          try {
            const conversation = await messagesService.getConversation(conversationId);
            
            set({ 
              activeConversation: conversation,
              messages: conversation.messages || [],
              isLoadingConversations: false 
            });
            
            return conversation;
          } catch (error) {
            console.error('Error fetching conversation:', error);
            set({ 
              isLoadingConversations: false, 
              conversationsError: error instanceof Error ? error.message : 'Failed to fetch conversation'
            });
            return null;
          }
        },
        
        fetchMessages: async (conversationId: string, page = 1, limit = 50) => {
          set({ isLoadingMessages: true, messagesError: null });
          
          try {
            const skip = (page - 1) * limit;
            const messages = await messagesService.getMessages(conversationId, skip, limit);
            
            set({ messages, isLoadingMessages: false });
            return messages;
          } catch (error) {
            console.error('Error fetching messages:', error);
            set({ 
              isLoadingMessages: false, 
              messagesError: error instanceof Error ? error.message : 'Failed to fetch messages'
            });
            return [];
          }
        },
        
        fetchMessageTemplates: async (category?: string) => {
          set({ isLoadingTemplates: true, templatesError: null });
          
          try {
            const templates = await messagesService.getMessageTemplates(category);
            
            set({ messageTemplates: templates, isLoadingTemplates: false });
            return templates;
          } catch (error) {
            console.error('Error fetching message templates:', error);
            set({ 
              isLoadingTemplates: false, 
              templatesError: error instanceof Error ? error.message : 'Failed to fetch templates'
            });
            return [];
          }
        },
        
        sendMessage: async (message: CreateMessageDto) => {
          const { activeConversation } = get();
          if (!activeConversation) throw new Error('No active conversation');
          
          set({ isSendingMessage: true, sendError: null });
          
          try {
            const newMessage = await messagesService.createMessage(
              activeConversation.id,
              message
            );
            
            // Update messages list
            const currentMessages = get().messages;
            set({ 
              messages: [...currentMessages, newMessage],
              isSendingMessage: false,
              // Clear draft if needed
              draftMessage: ''
            });
            
            // Update conversation list if needed
            const updatedConversations = get().conversations.map(conv => {
              if (conv.id === activeConversation.id) {
                return {
                  ...conv,
                  last_message: {
                    content: newMessage.content,
                    sender: newMessage.sender.name,
                    timestamp: newMessage.created_at,
                    status: newMessage.status
                  },
                  updated_at: newMessage.created_at
                };
              }
              return conv;
            });
            
            set({ 
              conversations: updatedConversations,
            });

            // Update filtered conversations after updating conversations
            get().filterConversations();
          } catch (error) {
            console.error('Error sending message:', error);
            set({ 
              isSendingMessage: false, 
              sendError: error instanceof Error ? error.message : 'Failed to send message'
            });
          }
        },
        createConversation: async (data: CreateConversationDto) => {
          set({ isLoadingConversations: true, conversationsError: null });
          
          try {
            const newConversation = await messagesService.createConversation(data);
            
            // Add to conversations list
            const currentConversations = get().conversations;
            set({ 
              conversations: [newConversation, ...currentConversations],
              activeConversation: newConversation,
              isComposing: false,
              selectedRecipients: [],
              isLoadingConversations: false 
            });
            
            // Apply any active filters
            get().filterConversations();
            
            return newConversation.id;
          } catch (error) {
            console.error('Error creating conversation:', error);
            set({ 
              isLoadingConversations: false, 
              conversationsError: error instanceof Error ? error.message : 'Failed to create conversation'
            });
            return null;
          }
        },
        
        markMessagesAsRead: async (messageIds: string[]) => {
          try {
            await messagesService.markMessagesAsRead(messageIds);
            
            // Update local message status
            const updatedMessages = get().messages.map(msg => {
              if (messageIds.includes(msg.id)) {
                return {
                  ...msg,
                  status: MessageStatus.READ
                };
              }
              return msg;
            });
            
            set({ messages: updatedMessages });
            
            // Update unread count
            if (messageIds.length > 0) {
              const currentUser = "7"; // You'd get this from auth
              get().fetchUnreadCount(currentUser);
            }
            
          } catch (error) {
            console.error('Error marking messages as read:', error);
            // We don't set error state here as this is a background operation
          }
        },
        
        fetchAvailableRecipients: async () => {
          set({ isLoadingRecipients: true, recipientsError: null });
          
          try {
            // This would normally call the API, but for this demo we'll create mock data
            // In a real app, you'd make an API call like:
            // const recipients = await messagesService.getAvailableRecipients();
            
            // Mock data for demonstration
            const mockRecipients: Participant[] = [
              { id: "1", type: "candidate", name: "John Doe", avatar: null },
              { id: "2", type: "candidate", name: "Jane Smith", avatar: null },
              { id: "3", type: "candidate", name: "Alice Johnson", avatar: null },
              { id: "4", type: "employer", name: "Tech Solutions", avatar: null },
              { id: "5", type: "employer", name: "Global Industries", avatar: null },
              { id: "6", type: "admin", name: "Admin User", avatar: null },
              { id: "7", type: "consultant", name: "David Consultant", avatar: null },
              { id: "8", type: "consultant", name: "Sarah Expert", avatar: null }
            ];
            
            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 500));
            
            set({ 
              suggestedRecipients: mockRecipients,
              isLoadingRecipients: false 
            });
          } catch (error) {
            console.error('Error fetching recipients:', error);
            set({ 
              isLoadingRecipients: false, 
              recipientsError: error instanceof Error ? error.message : 'Failed to fetch recipients'
            });
          }
        },
        
        fetchUnreadCount: async (userId: string) => {
          try {
            const count = await messagesService.getUnreadCount(userId);
            set({ unreadCount: count });
          } catch (error) {
            console.error('Error fetching unread count:', error);
            // Don't set error state for this background operation
          }
        },
        
        uploadAttachment: async (file: File) => {
          set({ isUploadingAttachment: true, uploadError: null });
          
          try {
            const attachment = await messagesService.uploadAttachment(file);
            
            // Convert to MessageAttachment if needed
            const messageAttachment: MessageAttachment = {
              id: attachment.id,
              name: attachment.name,
              file_type: attachment.type || 'application/octet-stream',
              file_size: attachment.size,
              url: attachment.url,
              storage_path: attachment.url, // Use URL as storage path if not provided
              uploaded_at: new Date().toISOString()
            };
            
            // Add to attachments list
            const currentAttachments = get().attachments;
            set({ 
              attachments: [...currentAttachments, messageAttachment],
              isUploadingAttachment: false 
            });
            
            return messageAttachment;
          } catch (error) {
            console.error('Error uploading attachment:', error);
            set({ 
              isUploadingAttachment: false, 
              uploadError: error instanceof Error ? error.message : 'Failed to upload attachment'
            });
            return null;
          }
        },
        
        deleteConversation: async (conversationId: string) => {
          try {
            await messagesService.deleteConversation(conversationId);
            
            // Remove from list
            const currentConversations = get().conversations;
            const updatedConversations = currentConversations.filter(c => c.id !== conversationId);
            
            set({ 
              conversations: updatedConversations,
              filteredConversations: get().filteredConversations.filter(c => c.id !== conversationId),
              activeConversation: get().activeConversation?.id === conversationId ? null : get().activeConversation
            });
            
            return true;
          } catch (error) {
            console.error('Error deleting conversation:', error);
            return false;
          }
        },
        
        // UI Methods
        setActiveConversation: (conversation: Conversation | null) => {
          set({ 
            activeConversation: conversation,
            isComposing: false,
            selectedRecipients: [],
            draftMessage: '',
            showContactDetails: false 
          });
          
          // If conversation set, fetch latest messages
          if (conversation) {
            get().fetchMessages(conversation.id);
          }
        },
        
        setSearchTerm: (term: string) => {
          set({ searchTerm: term });
          get().filterConversations();
        },
        
        setActiveFilter: (filter: string) => {
          set({ activeFilter: filter });
          get().filterConversations();
        },
        
        toggleContactDetails: () => {
          set(state => ({ showContactDetails: !state.showContactDetails }));
        },
        
        startComposing: () => {
          set({ 
            isComposing: true,
            activeConversation: null,
            selectedRecipients: [],
            draftMessage: ''
          });
        },
        
        cancelComposing: () => {
          set({ 
            isComposing: false,
            selectedRecipients: [],
            draftMessage: ''
          });
        },
        
        selectRecipient: (recipient: Participant) => {
          const { selectedRecipients } = get();
          // Check if already selected
          if (selectedRecipients.some(r => r.id === recipient.id)) {
            return;
          }
          
          set({ selectedRecipients: [...selectedRecipients, recipient] });
        },
        
        removeRecipient: (recipientId: string) => {
          const { selectedRecipients } = get();
          set({ 
            selectedRecipients: selectedRecipients.filter(r => r.id !== recipientId)
          });
        },
        
        updateDraftMessage: (content: string) => {
          set({ draftMessage: content });
        },
        
        clearAttachments: () => {
          set({ attachments: [] });
        },
        
        removeAttachment: (id: string) => {
          const { attachments } = get();
          set({ attachments: attachments.filter(a => a.id !== id) });
        },
        
        filterConversations: () => {
          const { conversations, searchTerm, activeFilter } = get();
          let filtered = [...conversations];
          
          // Apply search filter if any
          if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(conv => {
              // Search in title
              if (conv.title && conv.title.toLowerCase().includes(term)) {
                return true;
              }
              
              // Search in participants
              if (conv.participants.some(p => p.name.toLowerCase().includes(term))) {
                return true;
              }
              
              // Search in last message
              if (conv.last_message && conv.last_message.content.toLowerCase().includes(term)) {
                return true;
              }
              
              return false;
            });
          }
          
          // Apply type filter
          if (activeFilter !== 'all') {
            if (activeFilter === 'unread') {
              filtered = filtered.filter(conv => conv.unread_count > 0);
            } else if (activeFilter === 'group') {
              filtered = filtered.filter(conv => conv.type === 'group');
            } else if (activeFilter === 'individual') {
              filtered = filtered.filter(conv => conv.type === 'individual');
            } else {
              // Filter by participant type (candidate, employer, etc)
              filtered = filtered.filter(conv => 
                conv.participants.some(p => p.type === activeFilter)
              );
            }
          }
          
          set({ filteredConversations: filtered });
          return filtered;
        },
        
        resetErrors: () => {
          set({ 
            conversationsError: null,
            messagesError: null,
            templatesError: null,
            sendError: null,
            uploadError: null
          });
        }
      }),
      {
        name: 'messaging-store',
        // Only persist certain parts of the state
        partialize: (state) => ({
          draftMessage: state.draftMessage,
          unreadCount: state.unreadCount,
        }),
      }
    )
  )
);

export default useMessagingStore;