#!/usr/bin/env python3

"""
Script to add a new email template to the database.
Example usage:
    python add_email_template.py
"""

import sys
import logging
from sqlalchemy.orm import Session
from uuid import UUID

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Add template details
TEMPLATE_ID = "interview_invitation"
TEMPLATE_NAME = "Interview Invitation"
TEMPLATE_SUBJECT = "Interview Invitation: {{job_title}} at {{company_name}}"
TEMPLATE_BODY = """Dear {{candidate_name}},

We're pleased to inform you that after reviewing your application for the {{job_title}} position at {{company_name}}, we would like to invite you for an interview.

Your profile has shown impressive strengths in the following areas:
{{cv_analysis}}

Which particularly align with this role's requirements for:
{{matching_skills}}

Could you please let us know your availability for an interview in the coming week? The interview will last approximately 45 minutes and will be conducted via {{interview_format}}.

We look forward to discussing your qualifications and experience in more detail.

Best regards,
{{consultant_name}}
Recruitment Consultant
RecrutementPlus"""

TEMPLATE_TYPE = "candidate_communication"
TEMPLATE_CATEGORY = "interview"

def add_email_template(db: Session):
    """Add a new email template to the database."""
    from app.schemas.messaging import EmailTemplateCreate
    from app.services.messaging import messaging_service
    
    try:
        # Create template data
        template_data = EmailTemplateCreate(
            name=TEMPLATE_NAME,
            subject=TEMPLATE_SUBJECT,
            body=TEMPLATE_BODY,
            template_type=TEMPLATE_TYPE,
            category=TEMPLATE_CATEGORY,
            language="en",
            variables=messaging_service._extract_template_variables(TEMPLATE_BODY),
            required_variables=["candidate_name", "job_title", "company_name", "consultant_name"],
            is_active=True,
            is_default=False,
            description="Template for inviting candidates to job interviews"
        )
        
        # Get superadmin ID
        from app.models.user import User
        from app.models.enums import UserRole
        
        admin = db.query(User).filter(
            User.role == UserRole.SUPERADMIN
        ).first()
        
        if not admin:
            raise ValueError("No superadmin user found in database")
            
        # Create the template
        template = messaging_service.create_email_template(
            db,
            template_data=template_data,
            created_by=admin.id
        )
        
        logger.info(f"Email template '{TEMPLATE_NAME}' created with ID: {template.id}")
        return template
        
    except Exception as e:
        logger.error(f"Error creating email template: {e}")
        raise
    
if __name__ == "__main__":
    try:
        from app.db.session import SessionLocal
        
        # Create database session
        db = SessionLocal()
        
        try:
            # Add email template
            template = add_email_template(db)
            print(f"✅ Email template '{TEMPLATE_NAME}' added successfully with ID: {template.id}")
            
        except Exception as e:
            print(f"❌ Error adding email template: {e}")
            import traceback
            traceback.print_exc()
            db.rollback()
            
        finally:
            db.close()
            
    except Exception as e:
        print(f"❌ Setup failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)