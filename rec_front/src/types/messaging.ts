// These enum values must match the backend models exactly
export enum MessageType {
  TEXT = "text",
  FILE = "file",
  TEMPLATE = "template"
}

export enum MessageStatus {
  SENT = "sent",
  DELIVERED = "delivered",
  READ = "read",
  FAILED = "failed",
  DRAFT = "draft" // For scheduled messages
}

export enum ParticipantRole {
  ADMIN = "admin",
  MEMBER = "member"
}

export enum ParticipantStatus {
  ACTIVE = "active",
  REMOVED = "removed"
}

export interface EntityReference {
  type: string;
  id: string; // Changed to string to match backend
  name: string;
}

export interface MessageAttachment {
  id: string; // Changed to string
  name: string;
  file_type: string;
  file_size: number;
  url: string; // For UI display
  storage_path: string; // For backend reference
  uploaded_at: string;
}

export interface Participant {
  id: string; // Changed to string
  type: string; // 'admin', 'candidate', 'employer', 'consultant', 'system'
  name: string;
  avatar: string | null;
}

export interface Message {
  id: string; // Changed to string
  conversation_id: string; // Changed to string
  content: string;
  sender: Participant; // Changed to match backend
  recipients: Participant[]; // Added to match backend
  created_at: string;
  updated_at: string;
  status: MessageStatus;
  type: MessageType;
  template_id?: string;
  entity_references: EntityReference[];
  attachments: MessageAttachment[];
  scheduled_for?: string; // ISO date string for scheduled messages
  priority?: string; // Added to match backend
  flags?: string[]; // Added to match backend
}

// UI representation of a message is the same as backend model
export interface UIMessage extends Message {}

export interface LastMessage {
  content: string;
  sender: string;
  timestamp: string;
  status: MessageStatus;
}

export interface Conversation {
  id: string; // Changed to string
  title: string | null;
  participants: Participant[];
  type: 'individual' | 'group'; // To match backend
  last_message: LastMessage | null;
  unread_count: number;
  created_at: string;
  updated_at: string;
  associated_entities?: EntityReference[];
  is_starred?: boolean;
  has_attachments?: boolean;
}

// UI representation of a conversation is the same as backend model
export interface UIConversation extends Conversation {}

export interface ConversationWithMessages extends Conversation {
  messages: Message[];
}

export interface UIConversationWithMessages extends UIConversation {
  messages: UIMessage[];
}

export interface CreateMessageDto {
  content: string;
  sender: Participant; // Changed to match backend
  recipients: Participant[]; // Changed to match backend
  conversation_id: string; // Changed to string
  type?: MessageType;
  template_id?: string;
  entity_references?: EntityReference[];
  attachments?: {
    name: string;
    file_size: number;
    file_type: string;
    storage_path: string;
    url?: string;
  }[];
  scheduled_for?: string;
  priority?: string; // Added to match backend
}

export interface CreateConversationDto {
  title?: string | null;
  participants: Participant[]; // Changed to match backend
  type: 'individual' | 'group'; // Match backend
  associated_entities?: EntityReference[];
}

export interface UpdateMessageDto {
  status?: MessageStatus;
  content?: string;
  flags?: string[]; // Added to match backend
}

export interface UnreadCount {
  count: number;
}

export interface Attachment {
  id: string; // Changed to string
  type: string;
  name: string;
  url: string;
  size: number;
  mimeType?: string;
}

export interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  category: string;
  variables?: string[];
  created_at?: string; // Added to match backend
  updated_at?: string; // Added to match backend
}

export interface MarkMessagesReadRequest {
  message_ids: string[]; // Changed to string[]
}

// UI State interfaces
export interface MessagingUIState {
  activeConversation: UIConversation | null;
  searchTerm: string;
  activeFilter: string;
  filteredConversations: UIConversation[];
  isMobileView: boolean;
  showContactDetails: boolean;
  isComposing: boolean;
  selectedRecipients: Participant[];
  draftMessage: string;
}

// Notification preferences
export interface NotificationPreferences {
  user_id: string;
  in_app: boolean;
  email: boolean;
  email_digest: string; // 'never', 'daily', 'weekly'
  sms: boolean;
  do_not_disturb_start?: string;
  do_not_disturb_end?: string;
}

export interface NotificationPreferencesUpdate {
  in_app?: boolean;
  email?: boolean;
  email_digest?: string;
  sms?: boolean;
  do_not_disturb_start?: string;
  do_not_disturb_end?: string;
}