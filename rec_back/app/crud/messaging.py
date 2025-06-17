from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session, joinedload, selectinload
from sqlalchemy import and_, or_, desc, asc, func
from uuid import UUID
from datetime import datetime

from app.crud.base import CRUDBase
from app.models.messaging import (
    Conversation, Message, MessageAttachment, MessageReadReceipt, 
    MessageReaction, EmailTemplate, ConversationType, MessageType
)
from app.models.user import User
from app.schemas.messaging import (
    ConversationCreate, ConversationUpdate,
    MessageCreate, MessageUpdate,
    MessageAttachmentCreate, MessageAttachmentUpdate,
    EmailTemplateCreate, EmailTemplateUpdate
)


class CRUDConversation(CRUDBase[Conversation, ConversationCreate, ConversationUpdate]):
    def get_with_details(self, db: Session, *, id: UUID) -> Optional[Conversation]:
        """Get conversation with participants and recent messages"""
        return db.query(Conversation)\
            .options(
                joinedload(Conversation.created_by),
                selectinload(Conversation.participants),
                selectinload(Conversation.messages).joinedload(Message.sender)
            )\
            .filter(Conversation.id == id)\
            .first()
    
    def get_user_conversations(self, db: Session, *, user_id: UUID, skip: int = 0, limit: int = 50) -> List[Conversation]:
        """Get conversations for a user"""
        from app.models.messaging import conversation_participants
        return db.query(Conversation)\
            .join(conversation_participants)\
            .filter(conversation_participants.c.user_id == user_id)\
            .options(
                joinedload(Conversation.created_by),
                selectinload(Conversation.participants)
            )\
            .order_by(desc(Conversation.last_activity_at))\
            .offset(skip)\
            .limit(limit)\
            .all()
    
    def create_direct_conversation(self, db: Session, *, user1_id: UUID, user2_id: UUID, title: Optional[str] = None) -> Conversation:
        """Create a direct conversation between two users"""
        conversation = Conversation(
            title=title,
            type=ConversationType.DIRECT,
            created_by_id=user1_id,
            last_activity_at=datetime.utcnow()
        )
        db.add(conversation)
        db.flush()  # Get the ID
        
        # Add participants
        from app.models.messaging import conversation_participants
        db.execute(
            conversation_participants.insert().values([
                {"conversation_id": conversation.id, "user_id": user1_id, "joined_at": datetime.utcnow()},
                {"conversation_id": conversation.id, "user_id": user2_id, "joined_at": datetime.utcnow()}
            ])
        )
        
        db.commit()
        db.refresh(conversation)
        return conversation
    
    def add_participant(self, db: Session, *, conversation_id: UUID, user_id: UUID) -> bool:
        """Add participant to conversation"""
        from app.models.messaging import conversation_participants
        try:
            db.execute(
                conversation_participants.insert().values(
                    conversation_id=conversation_id,
                    user_id=user_id,
                    joined_at=datetime.utcnow()
                )
            )
            db.commit()
            return True
        except Exception:
            db.rollback()
            return False
    
    def remove_participant(self, db: Session, *, conversation_id: UUID, user_id: UUID) -> bool:
        """Remove participant from conversation"""
        from app.models.messaging import conversation_participants
        try:
            db.execute(
                conversation_participants.update()
                .where(
                    and_(
                        conversation_participants.c.conversation_id == conversation_id,
                        conversation_participants.c.user_id == user_id
                    )
                )
                .values(left_at=datetime.utcnow())
            )
            db.commit()
            return True
        except Exception:
            db.rollback()
            return False
    
    def update_last_activity(self, db: Session, *, conversation_id: UUID) -> Optional[Conversation]:
        """Update last activity timestamp"""
        conversation = self.get(db, id=conversation_id)
        if conversation:
            conversation.last_activity_at = datetime.utcnow()
            db.commit()
            db.refresh(conversation)
        return conversation


class CRUDMessage(CRUDBase[Message, MessageCreate, MessageUpdate]):
    def get_with_details(self, db: Session, *, id: UUID) -> Optional[Message]:
        """Get message with sender and attachments"""
        return db.query(Message)\
            .options(
                joinedload(Message.sender),
                joinedload(Message.conversation),
                selectinload(Message.attachments),
                selectinload(Message.read_receipts)
            )\
            .filter(Message.id == id)\
            .first()
    
    def get_conversation_messages(
        self, 
        db: Session, 
        *, 
        conversation_id: UUID, 
        skip: int = 0, 
        limit: int = 50
    ) -> List[Message]:
        """Get messages in a conversation"""
        return db.query(Message)\
            .options(
                joinedload(Message.sender),
                selectinload(Message.attachments)
            )\
            .filter(Message.conversation_id == conversation_id)\
            .order_by(desc(Message.created_at))\
            .offset(skip)\
            .limit(limit)\
            .all()
    
    def create_message(self, db: Session, *, message_data: MessageCreate) -> Message:
        """Create a new message and update conversation activity"""
        message = Message(**message_data.model_dump())
        message.sent_at = datetime.utcnow()
        db.add(message)
        db.flush()
        
        # Update conversation activity and message count
        conversation = db.query(Conversation).filter(Conversation.id == message.conversation_id).first()
        if conversation:
            conversation.last_activity_at = datetime.utcnow()
            conversation.last_message_at = datetime.utcnow()
            conversation.total_messages = (conversation.total_messages or 0) + 1
        
        db.commit()
        db.refresh(message)
        return message
    
    def mark_as_read(self, db: Session, *, message_id: UUID, user_id: UUID) -> bool:
        """Mark message as read by user"""
        try:
            read_receipt = MessageReadReceipt(
                message_id=message_id,
                user_id=user_id,
                read_at=datetime.utcnow()
            )
            db.add(read_receipt)
            db.commit()
            return True
        except Exception:
            db.rollback()
            return False
    
    def add_reaction(self, db: Session, *, message_id: UUID, user_id: UUID, emoji: str) -> bool:
        """Add reaction to message"""
        try:
            # Remove existing reaction by same user
            db.query(MessageReaction)\
                .filter(
                    and_(
                        MessageReaction.message_id == message_id,
                        MessageReaction.user_id == user_id
                    )
                )\
                .delete()
            
            # Add new reaction
            reaction = MessageReaction(
                message_id=message_id,
                user_id=user_id,
                emoji=emoji
            )
            db.add(reaction)
            db.commit()
            return True
        except Exception:
            db.rollback()
            return False


class CRUDMessageAttachment(CRUDBase[MessageAttachment, MessageAttachmentCreate, MessageAttachmentUpdate]):
    def get_by_message(self, db: Session, *, message_id: UUID) -> List[MessageAttachment]:
        """Get attachments for a message"""
        return db.query(MessageAttachment)\
            .filter(MessageAttachment.message_id == message_id)\
            .all()
    
    def increment_download_count(self, db: Session, *, attachment_id: UUID) -> Optional[MessageAttachment]:
        """Increment download count for attachment"""
        attachment = self.get(db, id=attachment_id)
        if attachment:
            attachment.download_count = (attachment.download_count or 0) + 1
            db.commit()
            db.refresh(attachment)
        return attachment


class CRUDEmailTemplate(CRUDBase[EmailTemplate, EmailTemplateCreate, EmailTemplateUpdate]):
    def get_by_type(self, db: Session, *, template_type: str) -> List[EmailTemplate]:
        """Get templates by type"""
        return db.query(EmailTemplate)\
            .filter(
                and_(
                    EmailTemplate.template_type == template_type,
                    EmailTemplate.is_active == True
                )
            )\
            .order_by(desc(EmailTemplate.is_default), asc(EmailTemplate.name))\
            .all()
    
    def get_default_template(self, db: Session, *, template_type: str) -> Optional[EmailTemplate]:
        """Get default template for a type"""
        return db.query(EmailTemplate)\
            .filter(
                and_(
                    EmailTemplate.template_type == template_type,
                    EmailTemplate.is_default == True,
                    EmailTemplate.is_active == True
                )
            )\
            .first()
    
    def increment_usage(self, db: Session, *, template_id: UUID) -> Optional[EmailTemplate]:
        """Increment template usage count"""
        template = self.get(db, id=template_id)
        if template:
            template.usage_count = (template.usage_count or 0) + 1
            template.last_used_at = datetime.utcnow()
            db.commit()
            db.refresh(template)
        return template
    
    def search_templates(self, db: Session, *, query: str, limit: int = 20) -> List[EmailTemplate]:
        """Search templates by name or content"""
        search_term = f"%{query}%"
        return db.query(EmailTemplate)\
            .filter(
                and_(
                    EmailTemplate.is_active == True,
                    or_(
                        EmailTemplate.name.ilike(search_term),
                        EmailTemplate.subject.ilike(search_term),
                        EmailTemplate.body.ilike(search_term)
                    )
                )
            )\
            .order_by(desc(EmailTemplate.usage_count))\
            .limit(limit)\
            .all()


# Create CRUD instances
conversation = CRUDConversation(Conversation)
message = CRUDMessage(Message)
message_attachment = CRUDMessageAttachment(MessageAttachment)
email_template = CRUDEmailTemplate(EmailTemplate)