// src/services/api/messages-service.ts
import { 
  Conversation, 
  ConversationWithMessages, 
  Message, 
  CreateMessageDto, 
  CreateConversationDto, 
  UnreadCount,
  MessageStatus,
  MarkMessagesReadRequest,
  MessageTemplate,
  NotificationPreferences,
  NotificationPreferencesUpdate,
  Attachment
} from '@/types';
import { fetcher } from './http-client';

export const messagesService = {
  getConversations: async (userId: string, skip = 0, limit = 100, unreadOnly = false, entityType?: string, entityId?: string) => {
    try {
      // Match backend path structure
      let query = `/conversations?user_id=${userId}&skip=${skip}&limit=${limit}`;
      
      if (unreadOnly) {
        query += `&unread_only=${unreadOnly}`;
      }
      
      if (entityType) {
        query += `&entity_type=${entityType}`;
      }
      
      if (entityId) {
        query += `&entity_id=${entityId}`;
      }
      
      console.log('Fetching conversations:', query);
      const response = await fetcher<Conversation[]>(query);
      console.log('Fetched conversations:', response);
      return response;
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
      throw error;
    }
  },
  
  getConversation: async (conversationId: string) => {
    try {
      const response = await fetcher<ConversationWithMessages>(`/conversations/${conversationId}`);
      console.log('Fetched conversation:', response);
      return response;
    } catch (error) {
      console.error('Failed to fetch conversation:', error);
      throw error;
    }
  },
  
  createConversation: async (data: CreateConversationDto) => {
    try {
      console.log('Creating conversation with data:', data);
      const response = await fetcher<Conversation>('/conversations', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      console.log('Created conversation:', response);
      return response;
    } catch (error) {
      console.error('Failed to create conversation:', error);
      throw error;
    }
  },
  
  getMessages: async (conversationId: string, skip = 0, limit = 50, before?: Date) => {
    try {
      let query = `/conversations/${conversationId}/messages?skip=${skip}&limit=${limit}`;
      
      if (before) {
        query += `&before=${before.toISOString()}`;
      }
      
      console.log('Fetching messages with query:', query);
      const response = await fetcher<Message[]>(query);
      console.log('Fetched messages:', response);
      return response;
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      throw error;
    }
  },
  
  createMessage: async (conversationId: string, data: CreateMessageDto) => {
    try {
      console.log('Creating message with data:', data);
      const response = await fetcher<Message>(`/conversations/${conversationId}/messages`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      console.log('Created message:', response);
      return response;
    } catch (error) {
      console.error('Failed to create message:', error);
      throw error;
    }
  },
  
  updateMessage: async (messageId: string, data: { status?: MessageStatus, flags?: string[] }) => {
    try {
      const response = await fetcher<Message>(`/messages/${messageId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      console.log('Updated message:', response);
      return response;
    } catch (error) {
      console.error('Failed to update message:', error);
      throw error;
    }
  },
  
  markMessagesAsRead: async (messageIds: string[]) => {
    try {
      const request: MarkMessagesReadRequest = {
        message_ids: messageIds
      };
      
      await fetcher(`/messages/read`, {
        method: 'POST',
        body: JSON.stringify(request),
      });
      console.log('Marked messages as read:', messageIds);
      return true;
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
      throw error;
    }
  },
  
  getUnreadCount: async (userId: string) => {
    try {
      // This endpoint doesn't exist in backend API.
      // You'd need to add it or use a different approach
      const response = await fetcher<UnreadCount>(`/messages/unread-count?user_id=${userId}`);
      console.log('Unread count:', response.count);
      return response.count;
    } catch (error) {
      console.error('Failed to get unread count:', error);
      throw error;
    }
  },
  
  // Message templates
  getMessageTemplates: async (category?: string) => {
    try {
      let query = '/message-templates';
      if (category) {
        query += `?category=${category}`;
      }
      
      const response = await fetcher<MessageTemplate[]>(query);
      return response;
    } catch (error) {
      console.error('Failed to fetch message templates:', error);
      throw error;
    }
  },
  
  createMessageTemplate: async (template: { name: string, content: string, category: string, variables?: string[] }) => {
    try {
      const response = await fetcher<MessageTemplate>('/message-templates', {
        method: 'POST',
        body: JSON.stringify(template),
      });
      return response;
    } catch (error) {
      console.error('Failed to create message template:', error);
      throw error;
    }
  },
  
  updateMessageTemplate: async (templateId: string, updates: { name?: string, content?: string, category?: string, variables?: string[] }) => {
    try {
      const response = await fetcher<MessageTemplate>(`/message-templates/${templateId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      return response;
    } catch (error) {
      console.error('Failed to update message template:', error);
      throw error;
    }
  },
  
  deleteMessageTemplate: async (templateId: string) => {
    try {
      await fetcher(`/message-templates/${templateId}`, {
        method: 'DELETE',
      });
      return true;
    } catch (error) {
      console.error('Failed to delete message template:', error);
      throw error;
    }
  },
  
  // Notification preferences
  getNotificationPreferences: async (userId: string) => {
    try {
      const response = await fetcher<NotificationPreferences>(`/notification-preferences?user_id=${userId}`);
      return response;
    } catch (error) {
      console.error('Failed to fetch notification preferences:', error);
      throw error;
    }
  },
  
  updateNotificationPreferences: async (userId: string, preferences: NotificationPreferencesUpdate) => {
    try {
      const response = await fetcher<NotificationPreferences>(`/notification-preferences`, {
        method: 'PUT',
        body: JSON.stringify({ user_id: userId, ...preferences }),
      });
      return response;
    } catch (error) {
      console.error('Failed to update notification preferences:', error);
      throw error;
    }
  },
  
  // Attachments
  uploadAttachment: async (file: File): Promise<Attachment> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/attachments', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload attachment');
      }
      
      const data = await response.json();
      return {
        id: data.id,
        type: file.type.startsWith('image/') ? 'image' : 'file',
        name: data.name,
        url: data.url,
        size: data.size,
        mimeType: file.type
      };
    } catch (error) {
      console.error('Failed to upload attachment:', error);
      throw error;
    }
  },
  
  // Bulk messages
  sendBulkMessages: async (messages: CreateMessageDto[]) => {
    try {
      const response = await fetcher<Message[]>(`/messages/bulk`, {
        method: 'POST',
        body: JSON.stringify(messages),
      });
      return response;
    } catch (error) {
      console.error('Failed to send bulk messages:', error);
      throw error;
    }
  },
  
  // Delete conversation (archive)
  deleteConversation: async (conversationId: string) => {
    try {
      await fetcher(`/conversations/${conversationId}`, {
        method: 'DELETE',
      });
      return true;
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      throw error;
    }
  }
};

export default messagesService;