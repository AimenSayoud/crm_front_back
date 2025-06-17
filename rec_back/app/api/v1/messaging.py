from fastapi import APIRouter, Depends, HTTPException, Query, Path, UploadFile, File
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from uuid import UUID

from app.api.v1.deps import (
    get_database, get_current_active_user, get_admin_user,
    get_pagination_params, PaginationParams,
    get_common_filters, CommonFilters
)
from app.services.messaging import messaging_service
from app.schemas.messaging import (
    ConversationCreate, ConversationUpdate, Conversation, ConversationWithDetails,
    MessageCreate, MessageUpdate, Message, MessageWithDetails,
    MessageAttachmentCreate, MessageAttachment,
    EmailTemplateCreate, EmailTemplateUpdate, EmailTemplate, EmailTemplateWithStats,
    ConversationSearchFilters, MessageSearchFilters, EmailTemplateSearchFilters,
    ConversationListResponse, MessageListResponse, EmailTemplateListResponse,
    SendMessageRequest, CreateConversationRequest, MessageReactionRequest, MarkAsReadRequest
)
from app.models.user import User
from app.models.enums import UserRole, MessageType, ConversationType

router = APIRouter()

# ============== CONVERSATIONS ==============

@router.get("/conversations", response_model=ConversationListResponse)
async def list_conversations(
    # Search and filtering
    conversation_type: Optional[ConversationType] = Query(None, description="Filter by conversation type"),
    is_archived: Optional[bool] = Query(None, description="Filter by archived status"),
    participant_id: Optional[UUID] = Query(None, description="Filter by participant ID"),
    
    # Pagination and common filters
    pagination: PaginationParams = Depends(get_pagination_params),
    filters: CommonFilters = Depends(get_common_filters),
    
    # Authentication
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """
    List user's conversations with filtering.
    Users can only see conversations they participate in.
    """
    try:
        # Build search filters
        search_filters = ConversationSearchFilters(
            participant_id=current_user.id,  # Always filter by current user
            type=conversation_type,
            is_archived=is_archived,
            query=filters.q,
            page=pagination.page,
            page_size=pagination.page_size,
            sort_by=filters.sort_by or "last_message_at",
            sort_order=filters.sort_order
        )
        
        conversations, total = messaging_service.get_conversations_with_search(
            db, filters=search_filters
        )
        
        return ConversationListResponse(
            conversations=conversations,
            total=total,
            page=pagination.page,
            page_size=pagination.page_size,
            total_pages=(total + pagination.page_size - 1) // pagination.page_size
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving conversations: {str(e)}"
        )

@router.post("/conversations", response_model=Conversation)
async def create_conversation(
    conversation_data: CreateConversationRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """
    Create a new conversation.
    Any authenticated user can create conversations.
    """
    try:
        conversation = messaging_service.create_conversation(
            db,
            request=conversation_data,
            created_by=current_user.id
        )
        return conversation
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error creating conversation: {str(e)}"
        )

@router.get("/conversations/{conversation_id}", response_model=ConversationWithDetails)
async def get_conversation(
    conversation_id: UUID = Path(..., description="Conversation ID"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """
    Get conversation details.
    Only participants can view conversation details.
    """
    try:
        # Check if user is participant
        is_participant = messaging_service.is_conversation_participant(
            db, conversation_id=conversation_id, user_id=current_user.id
        )
        
        if not is_participant and current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN]:
            raise HTTPException(
                status_code=403,
                detail="Access denied to this conversation"
            )
        
        conversation = messaging_service.get_conversation_with_details(
            db, id=conversation_id
        )
        if not conversation:
            raise HTTPException(
                status_code=404,
                detail="Conversation not found"
            )
        
        return conversation
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving conversation: {str(e)}"
        )

@router.put("/conversations/{conversation_id}", response_model=Conversation)
async def update_conversation(
    conversation_update: ConversationUpdate,
    conversation_id: UUID = Path(..., description="Conversation ID"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """
    Update conversation details.
    Only participants can update conversation details.
    """
    try:
        # Check if user is participant
        is_participant = messaging_service.is_conversation_participant(
            db, conversation_id=conversation_id, user_id=current_user.id
        )
        
        if not is_participant and current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN]:
            raise HTTPException(
                status_code=403,
                detail="Access denied to update this conversation"
            )
        
        updated_conversation = messaging_service.update_conversation(
            db,
            conversation_id=conversation_id,
            update_data=conversation_update,
            updated_by=current_user.id
        )
        if not updated_conversation:
            raise HTTPException(
                status_code=404,
                detail="Conversation not found"
            )
        return updated_conversation
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error updating conversation: {str(e)}"
        )

@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: UUID = Path(..., description="Conversation ID"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """
    Delete a conversation.
    Only conversation creator or admins can delete conversations.
    """
    try:
        success = messaging_service.delete_conversation(
            db,
            conversation_id=conversation_id,
            deleted_by=current_user.id
        )
        if not success:
            raise HTTPException(
                status_code=404,
                detail="Conversation not found or access denied"
            )
        return {"message": "Conversation deleted successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error deleting conversation: {str(e)}"
        )

# ============== MESSAGES ==============

@router.get("/conversations/{conversation_id}/messages", response_model=MessageListResponse)
async def get_conversation_messages(
    conversation_id: UUID = Path(..., description="Conversation ID"),
    message_type: Optional[MessageType] = Query(None, description="Filter by message type"),
    sender_id: Optional[UUID] = Query(None, description="Filter by sender ID"),
    pagination: PaginationParams = Depends(get_pagination_params),
    filters: CommonFilters = Depends(get_common_filters),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """
    Get messages from a conversation.
    Only participants can view conversation messages.
    """
    try:
        # Check if user is participant
        is_participant = messaging_service.is_conversation_participant(
            db, conversation_id=conversation_id, user_id=current_user.id
        )
        
        if not is_participant and current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN]:
            raise HTTPException(
                status_code=403,
                detail="Access denied to conversation messages"
            )
        
        # Build search filters
        search_filters = MessageSearchFilters(
            conversation_id=conversation_id,
            message_type=message_type,
            sender_id=sender_id,
            query=filters.q,
            page=pagination.page,
            page_size=pagination.page_size,
            sort_by=filters.sort_by or "created_at",
            sort_order=filters.sort_order
        )
        
        messages, total = messaging_service.get_messages_with_search(
            db, filters=search_filters
        )
        
        return MessageListResponse(
            messages=messages,
            total=total,
            page=pagination.page,
            page_size=pagination.page_size,
            total_pages=(total + pagination.page_size - 1) // pagination.page_size
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving messages: {str(e)}"
        )

@router.post("/conversations/{conversation_id}/messages", response_model=Message)
async def send_message(
    message_data: SendMessageRequest,
    conversation_id: UUID = Path(..., description="Conversation ID"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """
    Send a message in a conversation.
    Only participants can send messages.
    """
    try:
        # Check if user is participant
        is_participant = messaging_service.is_conversation_participant(
            db, conversation_id=conversation_id, user_id=current_user.id
        )
        
        if not is_participant:
            raise HTTPException(
                status_code=403,
                detail="Access denied to send messages in this conversation"
            )
        
        message = messaging_service.send_message(
            db,
            conversation_id=conversation_id,
            sender_id=current_user.id,
            message_data=message_data
        )
        return message
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error sending message: {str(e)}"
        )

@router.put("/messages/{message_id}", response_model=Message)
async def update_message(
    message_update: MessageUpdate,
    message_id: UUID = Path(..., description="Message ID"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """
    Update a message.
    Only message sender or admins can update messages.
    """
    try:
        updated_message = messaging_service.update_message(
            db,
            message_id=message_id,
            update_data=message_update,
            updated_by=current_user.id
        )
        if not updated_message:
            raise HTTPException(
                status_code=404,
                detail="Message not found or access denied"
            )
        return updated_message
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error updating message: {str(e)}"
        )

@router.delete("/messages/{message_id}")
async def delete_message(
    message_id: UUID = Path(..., description="Message ID"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """
    Delete a message.
    Only message sender or admins can delete messages.
    """
    try:
        success = messaging_service.delete_message(
            db,
            message_id=message_id,
            deleted_by=current_user.id
        )
        if not success:
            raise HTTPException(
                status_code=404,
                detail="Message not found or access denied"
            )
        return {"message": "Message deleted successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error deleting message: {str(e)}"
        )

@router.post("/messages/{message_id}/read")
async def mark_message_as_read(
    message_id: UUID = Path(..., description="Message ID"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """
    Mark a message as read.
    Only message recipients can mark messages as read.
    """
    try:
        success = messaging_service.mark_message_as_read(
            db,
            message_id=message_id,
            reader_id=current_user.id
        )
        if not success:
            raise HTTPException(
                status_code=404,
                detail="Message not found or already read"
            )
        return {"message": "Message marked as read"}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error marking message as read: {str(e)}"
        )

@router.post("/messages/{message_id}/react")
async def add_message_reaction(
    reaction_data: MessageReactionRequest,
    message_id: UUID = Path(..., description="Message ID"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """
    Add a reaction to a message.
    Only conversation participants can react to messages.
    """
    try:
        reaction = messaging_service.add_message_reaction(
            db,
            message_id=message_id,
            user_id=current_user.id,
            reaction_type=reaction_data.reaction_type
        )
        return reaction
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error adding message reaction: {str(e)}"
        )

# ============== MESSAGE ATTACHMENTS ==============

@router.post("/messages/{message_id}/attachments", response_model=MessageAttachment)
async def upload_message_attachment(
    message_id: UUID = Path(..., description="Message ID"),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """
    Upload an attachment to a message.
    Only message sender can add attachments.
    """
    try:
        attachment = messaging_service.upload_message_attachment(
            db,
            message_id=message_id,
            file=file,
            uploaded_by=current_user.id
        )
        return attachment
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error uploading attachment: {str(e)}"
        )

# ============== EMAIL TEMPLATES ==============

@router.get("/templates", response_model=EmailTemplateListResponse)
async def list_email_templates(
    template_type: Optional[str] = Query(None, description="Filter by template type"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    pagination: PaginationParams = Depends(get_pagination_params),
    filters: CommonFilters = Depends(get_common_filters),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """
    List email templates.
    Consultants and admins can view email templates.
    """
    if current_user.role not in [UserRole.CONSULTANT, UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(
            status_code=403,
            detail="Insufficient permissions to view email templates"
        )
    
    try:
        search_filters = EmailTemplateSearchFilters(
            query=filters.q,
            template_type=template_type,
            is_active=is_active,
            page=pagination.page,
            page_size=pagination.page_size,
            sort_by=filters.sort_by or "name",
            sort_order=filters.sort_order
        )
        
        templates, total = messaging_service.get_email_templates_with_search(
            db, filters=search_filters
        )
        
        return EmailTemplateListResponse(
            templates=templates,
            total=total,
            page=pagination.page,
            page_size=pagination.page_size,
            total_pages=(total + pagination.page_size - 1) // pagination.page_size
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving email templates: {str(e)}"
        )

@router.post("/templates", response_model=EmailTemplate)
async def create_email_template(
    template_data: EmailTemplateCreate,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_database)
):
    """
    Create a new email template.
    Only admins can create email templates.
    """
    try:
        template = messaging_service.create_email_template(
            db,
            template_data=template_data,
            created_by=current_user.id
        )
        return template
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error creating email template: {str(e)}"
        )

@router.put("/templates/{template_id}", response_model=EmailTemplate)
async def update_email_template(
    template_update: EmailTemplateUpdate,
    template_id: UUID = Path(..., description="Template ID"),
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_database)
):
    """
    Update an email template.
    Only admins can update email templates.
    """
    try:
        updated_template = messaging_service.update_email_template(
            db,
            template_id=template_id,
            update_data=template_update,
            updated_by=current_user.id
        )
        if not updated_template:
            raise HTTPException(
                status_code=404,
                detail="Email template not found"
            )
        return updated_template
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error updating email template: {str(e)}"
        )

@router.delete("/templates/{template_id}")
async def delete_email_template(
    template_id: UUID = Path(..., description="Template ID"),
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_database)
):
    """
    Delete an email template.
    Only admins can delete email templates.
    """
    try:
        success = messaging_service.delete_email_template(
            db,
            template_id=template_id,
            deleted_by=current_user.id
        )
        if not success:
            raise HTTPException(
                status_code=404,
                detail="Email template not found"
            )
        return {"message": "Email template deleted successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error deleting email template: {str(e)}"
        )

# ============== BULK MESSAGING ==============

@router.post("/bulk-message")
async def send_bulk_message(
    recipient_ids: List[UUID] = Query(..., description="List of recipient user IDs"),
    subject: str = Query(..., description="Message subject"),
    content: str = Query(..., description="Message content"),
    template_id: Optional[UUID] = Query(None, description="Email template ID to use"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """
    Send bulk messages to multiple recipients.
    Consultants and admins can send bulk messages.
    """
    if current_user.role not in [UserRole.CONSULTANT, UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(
            status_code=403,
            detail="Insufficient permissions to send bulk messages"
        )
    
    try:
        results = messaging_service.send_bulk_message(
            db,
            sender_id=current_user.id,
            recipient_ids=recipient_ids,
            subject=subject,
            content=content,
            template_id=template_id
        )
        
        return {
            "total_recipients": len(recipient_ids),
            "successful_sends": len(results["successful"]),
            "failed_sends": len(results["failed"]),
            "results": results
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error sending bulk message: {str(e)}"
        )

# ============== EMAIL TEMPLATE RENDERING ==============

@router.post("/render-template/{template_id}")
async def render_email_template(
    context: Dict[str, Any],
    template_id: UUID = Path(..., description="Email template ID"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """
    Render an email template with provided context.
    Consultants and admins can render email templates.
    """
    if current_user.role not in [UserRole.CONSULTANT, UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(
            status_code=403,
            detail="Insufficient permissions to render email templates"
        )
    
    try:
        rendered_email = messaging_service.render_email_template(
            db,
            template_id=template_id,
            context=context
        )
        return rendered_email
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error rendering email template: {str(e)}"
        )

@router.get("/unread-count")
async def get_unread_message_count(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """
    Get unread message count for current user.
    All authenticated users can check their unread count.
    """
    try:
        unread_count = messaging_service.get_unread_count(
            db,
            user_id=current_user.id
        )
        return unread_count
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving unread count: {str(e)}"
        )

@router.post("/search")
async def search_messages(
    query: str = Query(..., description="Search query"),
    conversation_id: Optional[UUID] = Query(None, description="Limit search to specific conversation"),
    limit: int = Query(50, ge=1, le=100, description="Maximum results to return"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """
    Search messages accessible to current user.
    All authenticated users can search their messages.
    """
    try:
        messages = messaging_service.search_messages(
            db,
            user_id=current_user.id,
            query=query,
            conversation_id=conversation_id,
            limit=limit
        )
        return {
            "query": query,
            "results": messages,
            "total_found": len(messages)
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error searching messages: {str(e)}"
        )

@router.get("/conversation-summary")
async def get_conversation_summary(
    days: int = Query(7, ge=1, le=90, description="Number of days to analyze"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """
    Get conversation activity summary for current user.
    All authenticated users can view their conversation summary.
    """
    try:
        summary = messaging_service.get_conversation_summary(
            db,
            user_id=current_user.id,
            days=days
        )
        return summary
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving conversation summary: {str(e)}"
        )

@router.post("/conversations/{conversation_id}/archive")
async def archive_conversation(
    conversation_id: UUID = Path(..., description="Conversation ID"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """
    Archive a conversation for current user.
    Only conversation participants can archive conversations.
    """
    try:
        success = messaging_service.archive_conversation(
            db,
            conversation_id=conversation_id,
            user_id=current_user.id
        )
        if not success:
            raise HTTPException(
                status_code=404,
                detail="Conversation not found or access denied"
            )
        
        return {"message": "Conversation archived successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error archiving conversation: {str(e)}"
        )

@router.get("/templates/analytics")
async def get_email_template_analytics(
    template_id: Optional[UUID] = Query(None, description="Filter by specific template ID"),
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_database)
):
    """
    Get email template usage analytics.
    Only admins can view template analytics.
    """
    try:
        analytics = messaging_service.get_email_template_analytics(
            db,
            template_id=template_id
        )
        return analytics
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving template analytics: {str(e)}"
        )