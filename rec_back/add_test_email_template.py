#!/usr/bin/env python3
"""
Script to add a test interview_invitation email template to the database.
"""
import sys
import os
import logging
from uuid import uuid4
from datetime import datetime

# Add the project root to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def add_interview_invitation_template():
    """Add a test interview invitation template to the database"""
    try:
        # Import necessary modules
        from app.db.session import SessionLocal
        from app.models.messaging import EmailTemplate
        
        logger.info("Connecting to database...")
        db = SessionLocal()
        
        # Check if template already exists
        template_name = "Interview Invitation"
        template_id = "interview_invitation" # This will be used for lookup in the code
        
        existing = db.query(EmailTemplate).filter(
            EmailTemplate.name == template_name
        ).first()
        
        if existing:
            logger.info(f"Template already exists with ID: {existing.id}")
            return
            
        # Create a new template
        template = EmailTemplate(
            name=template_name,
            subject="Interview Invitation: {{job_title}} at {{company_name}}",
            body="""Dear {{candidate_name}},

I hope this email finds you well. We were impressed with your application for the {{job_title}} position at {{company_name}}.

We would like to invite you for an interview on {{interview_date}} at {{interview_time}} via {{interview_type}}. 

You'll be speaking with {{interviewer_name}}, who is looking forward to learning more about your experience and skills.

{{#if meeting_link}}
You can join the meeting using this link: {{meeting_link}}
{{/if}}

Please confirm your availability at your earliest convenience. If you have any questions or need to reschedule, don't hesitate to reach out.

Looking forward to speaking with you!""",
            template_type="interview_invitation",
            category="recruitment",
            language="en",
            variables=["candidate_name", "job_title", "company_name", "interview_date", 
                      "interview_time", "interview_type", "interviewer_name", "meeting_link"],
            required_variables=["candidate_name", "job_title", "company_name", "interview_date", 
                               "interview_time", "interviewer_name"],
            is_active=True,
            is_default=True,
            description="Standard template for inviting candidates to interviews",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        db.add(template)
        db.commit()
        logger.info(f"Successfully created interview invitation template with ID: {template.id}")
        
    except ImportError as e:
        logger.error(f"Import error: {e}")
        return
    except Exception as e:
        logger.error(f"Error adding template: {e}")
        logger.error("Full traceback:", exc_info=True)
        return

if __name__ == "__main__":
    add_interview_invitation_template()