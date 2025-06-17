from sqlalchemy import Column, String, Text, Boolean, DateTime, ForeignKey, Table, Integer
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from .base import BaseModel
from .enums import MessageType, MessageStatus, ConversationType


# Association table for conversation participants (many-to-many)
conversation_participants = Table(
    'conversation_participants',
    BaseModel.metadata,
    Column('conversation_id', UUID(as_uuid=True), ForeignKey('conversations.id'), primary_key=True),
    Column('user_id', UUID(as_uuid=True), ForeignKey('users.id'), primary_key=True),
    Column('joined_at', DateTime, nullable=False),
    Column('left_at', DateTime, nullable=True),
    Column('role', String(20), nullable=True),  # admin, member, observer
    Column('is_muted', Boolean, nullable=False, default=False),
    Column('last_read_at', DateTime, nullable=True)
)


class Conversation(BaseModel):
    __tablename__ = "conversations"
    
    title = Column(String(200), nullable=True)
    type = Column(String(20), nullable=False, default=ConversationType.DIRECT)
    created_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Conversation settings
    is_archived = Column(Boolean, nullable=False, default=False)
    is_pinned = Column(Boolean, nullable=False, default=False)
    is_private = Column(Boolean, nullable=False, default=True)
    allow_file_sharing = Column(Boolean, nullable=False, default=True)
    
    # Metadata
    description = Column(Text, nullable=True)
    tags = Column(JSONB, nullable=True)  # Array of tags for categorization
    
    # Statistics
    total_messages = Column(Integer, nullable=False, default=0)
    last_message_at = Column(DateTime, nullable=True)
    last_activity_at = Column(DateTime, nullable=True)
    
    # Relationships
    created_by = relationship("User", foreign_keys=[created_by_id])
    participants = relationship("User", secondary=conversation_participants, backref="conversations")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")


class Message(BaseModel):
    __tablename__ = "messages"
    
    conversation_id = Column(UUID(as_uuid=True), ForeignKey("conversations.id"), nullable=False)
    sender_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Message content
    content = Column(Text, nullable=True)
    message_type = Column(String(20), nullable=False, default=MessageType.TEXT)
    status = Column(String(20), nullable=False, default=MessageStatus.SENT)
    
    # Reply functionality
    parent_message_id = Column(UUID(as_uuid=True), ForeignKey("messages.id"), nullable=True)
    reply_to_id = Column(UUID(as_uuid=True), ForeignKey("messages.id"), nullable=True)
    
    # Message properties
    is_edited = Column(Boolean, nullable=False, default=False)
    is_deleted = Column(Boolean, nullable=False, default=False)
    is_pinned = Column(Boolean, nullable=False, default=False)
    is_system_message = Column(Boolean, nullable=False, default=False)
    
    # Delivery tracking
    sent_at = Column(DateTime, nullable=True)
    delivered_at = Column(DateTime, nullable=True)
    read_at = Column(DateTime, nullable=True)
    
    # Metadata
    mentions = Column(JSONB, nullable=True)  # Array of mentioned user IDs
    reactions = Column(JSONB, nullable=True)  # Emoji reactions
    
    # File/media info (if message_type is file/image)
    file_url = Column(String(500), nullable=True)
    file_name = Column(String(200), nullable=True)
    file_size = Column(Integer, nullable=True)
    file_type = Column(String(50), nullable=True)
    thumbnail_url = Column(String(500), nullable=True)
    
    # Template info (if message_type is template)
    template_id = Column(UUID(as_uuid=True), ForeignKey("email_templates.id"), nullable=True)
    template_variables = Column(JSONB, nullable=True)
    
    # Relationships - Fixed with proper foreign_keys specification
    conversation = relationship("Conversation", back_populates="messages")
    sender = relationship("User", foreign_keys=[sender_id])
    
    # Parent-child relationships with explicit foreign_keys
    parent_message = relationship(
        "Message", 
        remote_side="Message.id", 
        foreign_keys=[parent_message_id],
        back_populates="child_messages"
    )
    child_messages = relationship(
        "Message", 
        foreign_keys=[parent_message_id],
        back_populates="parent_message"
    )
    
    # Reply relationships with explicit foreign_keys
    reply_to = relationship(
        "Message", 
        remote_side="Message.id", 
        foreign_keys=[reply_to_id],
        back_populates="replies"
    )
    replies = relationship(
        "Message", 
        foreign_keys=[reply_to_id],
        back_populates="reply_to"
    )
    
    template = relationship("EmailTemplate", foreign_keys=[template_id])
    attachments = relationship("MessageAttachment", back_populates="message", cascade="all, delete-orphan")
    read_receipts = relationship("MessageReadReceipt", back_populates="message", cascade="all, delete-orphan")
    message_reactions = relationship("MessageReaction", back_populates="message", cascade="all, delete-orphan")


class MessageAttachment(BaseModel):
    __tablename__ = "message_attachments"
    
    message_id = Column(UUID(as_uuid=True), ForeignKey("messages.id"), nullable=False)
    
    # File information
    file_name = Column(String(200), nullable=False)
    file_url = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=True)
    file_type = Column(String(50), nullable=True)
    mime_type = Column(String(100), nullable=True)
    
    # Additional metadata
    description = Column(Text, nullable=True)
    is_inline = Column(Boolean, nullable=False, default=False)
    thumbnail_url = Column(String(500), nullable=True)
    
    # Access control
    is_public = Column(Boolean, nullable=False, default=False)
    download_count = Column(Integer, nullable=False, default=0)
    
    # Relationships
    message = relationship("Message", back_populates="attachments")


class MessageReadReceipt(BaseModel):
    __tablename__ = "message_read_receipts"
    
    message_id = Column(UUID(as_uuid=True), ForeignKey("messages.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    read_at = Column(DateTime, nullable=False)
    
    # Relationships
    message = relationship("Message", back_populates="read_receipts")
    user = relationship("User", backref="message_read_receipts")


class MessageReaction(BaseModel):
    __tablename__ = "message_reactions"
    
    message_id = Column(UUID(as_uuid=True), ForeignKey("messages.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    emoji = Column(String(10), nullable=False)  # Unicode emoji or emoji code
    
    # Relationships
    message = relationship("Message", back_populates="message_reactions")
    user = relationship("User", backref="reactions")


class EmailTemplate(BaseModel):
    __tablename__ = "email_templates"
    
    name = Column(String(100), nullable=False)
    subject = Column(String(200), nullable=False)
    body = Column(Text, nullable=False)
    
    # Template properties
    template_type = Column(String(50), nullable=False)  # welcome, interview_invite, rejection, etc.
    category = Column(String(50), nullable=True)
    language = Column(String(10), nullable=False, default="en")
    
    # Template variables and structure
    variables = Column(JSONB, nullable=True)  # Available template variables
    required_variables = Column(JSONB, nullable=True)  # Required variables
    default_values = Column(JSONB, nullable=True)  # Default values for variables
    
    # Status and versioning
    is_active = Column(Boolean, nullable=False, default=True)
    is_default = Column(Boolean, nullable=False, default=False)
    version = Column(String(20), nullable=True)
    
    # Usage tracking
    usage_count = Column(Integer, nullable=False, default=0)
    last_used_at = Column(DateTime, nullable=True)
    
    # Created by
    created_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    # Additional metadata
    description = Column(Text, nullable=True)
    tags = Column(JSONB, nullable=True)
    conversation_metadata = Column(JSONB, nullable=True)  # Additional template metadata
    
    # Relationships
    created_by = relationship("User", foreign_keys=[created_by_id])
    messages = relationship("Message", back_populates="template")