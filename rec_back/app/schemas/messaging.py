from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, validator
from uuid import UUID
from app.models.messaging import ConversationType, MessageType, MessageStatus


# Base schemas for Conversation
class ConversationBase(BaseModel):
    title: Optional[str] = Field(None, max_length=200)
    type: Optional[ConversationType] = ConversationType.DIRECT
    description: Optional[str] = None
    is_private: Optional[bool] = True
    allow_file_sharing: Optional[bool] = True


class ConversationCreate(ConversationBase):
    created_by_id: UUID
    participant_ids: Optional[List[UUID]] = None


class ConversationUpdate(ConversationBase):
    is_archived: Optional[bool] = None
    is_pinned: Optional[bool] = None


class Conversation(ConversationBase):
    id: UUID
    created_by_id: UUID
    is_archived: Optional[bool] = False
    is_pinned: Optional[bool] = False
    total_messages: Optional[int] = 0
    last_message_at: Optional[datetime] = None
    last_activity_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Conversation with participants and last message
class ConversationWithDetails(Conversation):
    participant_count: Optional[int] = 0
    participant_names: Optional[List[str]] = None
    last_message_preview: Optional[str] = None
    unread_count: Optional[int] = 0

    class Config:
        from_attributes = True


# Base schemas for Message
class MessageBase(BaseModel):
    content: Optional[str] = None
    message_type: Optional[MessageType] = MessageType.TEXT
    parent_message_id: Optional[UUID] = None
    reply_to_id: Optional[UUID] = None
    mentions: Optional[List[UUID]] = None


class MessageCreate(MessageBase):
    conversation_id: UUID
    sender_id: UUID


class MessageUpdate(MessageBase):
    is_edited: Optional[bool] = None
    is_pinned: Optional[bool] = None


class Message(MessageBase):
    id: UUID
    conversation_id: UUID
    sender_id: UUID
    status: MessageStatus
    is_edited: Optional[bool] = False
    is_deleted: Optional[bool] = False
    is_pinned: Optional[bool] = False
    is_system_message: Optional[bool] = False
    sent_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    read_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Message with sender details
class MessageWithDetails(Message):
    sender_name: Optional[str] = None
    sender_email: Optional[str] = None
    attachment_count: Optional[int] = 0
    reaction_count: Optional[int] = 0
    reply_count: Optional[int] = 0

    class Config:
        from_attributes = True


# Base schemas for Message Attachment
class MessageAttachmentBase(BaseModel):
    file_name: str = Field(..., min_length=1, max_length=200)
    file_url: str = Field(..., max_length=500)
    file_size: Optional[int] = Field(None, ge=0)
    file_type: Optional[str] = Field(None, max_length=50)
    mime_type: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    is_inline: Optional[bool] = False
    thumbnail_url: Optional[str] = Field(None, max_length=500)
    is_public: Optional[bool] = False


class MessageAttachmentCreate(MessageAttachmentBase):
    message_id: UUID


class MessageAttachmentUpdate(MessageAttachmentBase):
    file_name: Optional[str] = Field(None, min_length=1, max_length=200)
    file_url: Optional[str] = Field(None, max_length=500)


class MessageAttachment(MessageAttachmentBase):
    id: UUID
    message_id: UUID
    download_count: Optional[int] = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Base schemas for Email Template
class EmailTemplateBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    subject: str = Field(..., min_length=1, max_length=200)
    body: str = Field(..., min_length=1)
    template_type: str = Field(..., max_length=50)
    category: Optional[str] = Field(None, max_length=50)
    language: Optional[str] = Field("en", max_length=10)
    variables: Optional[List[str]] = None
    required_variables: Optional[List[str]] = None
    default_values: Optional[Dict[str, Any]] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = None
    is_active: Optional[bool] = True
    is_default: Optional[bool] = False


class EmailTemplateCreate(EmailTemplateBase):
    created_by_id: Optional[UUID] = None


class EmailTemplateUpdate(EmailTemplateBase):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    subject: Optional[str] = Field(None, min_length=1, max_length=200)
    body: Optional[str] = Field(None, min_length=1)
    template_type: Optional[str] = Field(None, max_length=50)


class EmailTemplate(EmailTemplateBase):
    id: UUID
    version: Optional[str] = None
    usage_count: Optional[int] = 0
    last_used_at: Optional[datetime] = None
    created_by_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Email template with usage statistics
class EmailTemplateWithStats(EmailTemplate):
    created_by_name: Optional[str] = None
    recent_usage_count: Optional[int] = 0  # Usage in last 30 days

    class Config:
        from_attributes = True


# Search and filter schemas
class ConversationSearchFilters(BaseModel):
    query: Optional[str] = Field(None, description="Search in title or participants")
    type: Optional[ConversationType] = Field(None, description="Filter by conversation type")
    is_archived: Optional[bool] = Field(None, description="Filter archived conversations")
    participant_id: Optional[UUID] = Field(None, description="Filter by participant")
    
    # Pagination
    page: int = Field(1, ge=1)
    page_size: int = Field(20, ge=1, le=100)
    
    # Sorting
    sort_by: Optional[str] = Field("last_activity_at", pattern="^(last_activity_at|last_message_at|created_at|title)$")
    sort_order: Optional[str] = Field("desc", pattern="^(asc|desc)$")


class MessageSearchFilters(BaseModel):
    query: Optional[str] = Field(None, description="Search in message content")
    conversation_id: Optional[UUID] = Field(None, description="Filter by conversation")
    sender_id: Optional[UUID] = Field(None, description="Filter by sender")
    message_type: Optional[MessageType] = Field(None, description="Filter by message type")
    has_attachments: Optional[bool] = Field(None, description="Filter messages with attachments")
    is_pinned: Optional[bool] = Field(None, description="Filter pinned messages")
    date_from: Optional[datetime] = Field(None, description="Messages after date")
    date_to: Optional[datetime] = Field(None, description="Messages before date")
    
    # Pagination
    page: int = Field(1, ge=1)
    page_size: int = Field(50, ge=1, le=100)
    
    # Sorting
    sort_by: Optional[str] = Field("created_at", pattern="^(created_at|sent_at)$")
    sort_order: Optional[str] = Field("desc", pattern="^(asc|desc)$")


class EmailTemplateSearchFilters(BaseModel):
    query: Optional[str] = Field(None, description="Search in name, subject, or body")
    template_type: Optional[str] = Field(None, description="Filter by template type")
    category: Optional[str] = Field(None, description="Filter by category")
    language: Optional[str] = Field(None, description="Filter by language")
    is_active: Optional[bool] = Field(None, description="Filter active templates")
    created_by: Optional[UUID] = Field(None, description="Filter by creator")
    
    # Pagination
    page: int = Field(1, ge=1)
    page_size: int = Field(20, ge=1, le=100)
    
    # Sorting
    sort_by: Optional[str] = Field("name", pattern="^(name|usage_count|created_at|last_used_at)$")
    sort_order: Optional[str] = Field("asc", pattern="^(asc|desc)$")


# Response schemas
class ConversationListResponse(BaseModel):
    conversations: List[ConversationWithDetails]
    total: int
    page: int
    page_size: int
    total_pages: int

    class Config:
        from_attributes = True


class MessageListResponse(BaseModel):
    messages: List[MessageWithDetails]
    total: int
    page: int
    page_size: int
    total_pages: int

    class Config:
        from_attributes = True


class EmailTemplateListResponse(BaseModel):
    templates: List[EmailTemplateWithStats]
    total: int
    page: int
    page_size: int
    total_pages: int

    class Config:
        from_attributes = True


# Action schemas
class SendMessageRequest(BaseModel):
    content: str = Field(..., min_length=1)
    message_type: Optional[MessageType] = MessageType.TEXT
    reply_to_id: Optional[UUID] = None
    mentions: Optional[List[UUID]] = None
    attachment_urls: Optional[List[str]] = None


class CreateConversationRequest(BaseModel):
    title: Optional[str] = None
    type: ConversationType = ConversationType.DIRECT
    participant_ids: List[UUID] = Field(..., min_items=1)
    initial_message: Optional[str] = None


class MessageReactionRequest(BaseModel):
    emoji: str = Field(..., min_length=1, max_length=10)


class MarkAsReadRequest(BaseModel):
    message_ids: List[UUID] = Field(..., min_items=1)