from .base import CRUDBase
from .candidate import (
    candidate_profile, education, work_experience, candidate_job_preference,
    candidate_notification_settings, candidate_skill
)
from .employer import (
    company, employer_profile, company_contact, 
    company_hiring_preferences, recruitment_history
)
from .job import job, job_skill_requirement
from .application import application, application_status_history, application_note
from .skill import skill, skill_category
from .messaging import conversation, message, message_attachment, email_template
from .admin import (
    admin_profile, superadmin_profile, admin_audit_log, 
    system_configuration, admin_notification
)
from .consultant import (
    consultant_profile, consultant_target, consultant_performance_review,
    consultant_candidate, consultant_client
)

__all__ = [
    # Base
    "CRUDBase",
    
    # Candidate
    "candidate_profile",
    "education", 
    "work_experience",
    "candidate_job_preference",
    "candidate_notification_settings",
    "candidate_skill",
    
    # Employer/Company
    "company",
    "employer_profile",
    "company_contact",
    "company_hiring_preferences",
    "recruitment_history",
    
    # Job
    "job",
    "job_skill_requirement",
    
    # Application
    "application",
    "application_status_history",
    "application_note",
    
    # Skills
    "skill",
    "skill_category",
    
    # Messaging
    "conversation",
    "message",
    "message_attachment",
    "email_template",
    
    # Admin
    "admin_profile",
    "superadmin_profile",
    "admin_audit_log",
    "system_configuration",
    "admin_notification",
    
    # Consultant
    "consultant_profile",
    "consultant_target",
    "consultant_performance_review",
    "consultant_candidate",
    "consultant_client",
]