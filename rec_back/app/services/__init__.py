from .base import BaseService
from .auth import auth_service, AuthService
from .candidate import candidate_service, CandidateService
from .job import job_service, JobService
from .application import application_service, ApplicationService
from .company import company_service, CompanyService
from .consultant import consultant_service, ConsultantService
from .notification import notification_service, NotificationService
from .analytics import analytics_service, AnalyticsService

__all__ = [
    # Base
    "BaseService",
    
    # Auth
    "auth_service",
    "AuthService",
    
    # Candidate
    "candidate_service", 
    "CandidateService",
    
    # Job
    "job_service",
    "JobService",
    
    # Application
    "application_service",
    "ApplicationService",
    
    # Company
    "company_service",
    "CompanyService",
    
    # Consultant
    "consultant_service",
    "ConsultantService",
    
    # Notification
    "notification_service",
    "NotificationService",
    
    # Analytics
    "analytics_service",
    "AnalyticsService",
]