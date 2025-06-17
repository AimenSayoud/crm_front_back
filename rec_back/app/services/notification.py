# app/services/notification.py
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from uuid import UUID
from datetime import datetime, timedelta
import asyncio
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import json

from app.models.user import User, UserRole
from app.models.candidate import CandidateProfile, CandidateNotificationSettings
from app.models.application import Application, ApplicationStatus
from app.models.job import Job
from app.models.messaging import EmailTemplate, Message, Conversation
from app.core.config import settings


class NotificationService:
    """Service for managing notifications across the platform"""
    
    def __init__(self):
        self.email_queue = []
        self.sms_queue = []
        self.push_queue = []
        self._init_notification_clients()
    
    def _init_notification_clients(self):
        """Initialize notification service clients"""
        # Initialize email service (SendGrid, AWS SES, etc.)
        # Initialize SMS service (Twilio, etc.)
        # Initialize push notification service (FCM, APNS, etc.)
        pass
    
    # Application Notifications
    
    def notify_application_submitted(
        self, 
        db: Session, 
        *, 
        application: Application
    ):
        """Send notifications when application is submitted"""
        # Notify candidate
        self._send_application_confirmation(db, application)
        
        # Notify employer
        self._notify_employer_new_application(db, application)
        
        # Notify assigned consultant if any
        if application.consultant_id:
            self._notify_consultant_new_application(db, application)
    
    def notify_application_status_change(
        self, 
        db: Session, 
        *, 
        application: Application,
        old_status: ApplicationStatus,
        new_status: ApplicationStatus,
        message: Optional[str] = None
    ):
        """Send notifications for application status changes"""
        candidate = application.candidate
        
        # Check candidate notification preferences
        if not self._should_notify_candidate(db, candidate.id, "application_updates"):
            return
        
        # Determine notification type and content
        notification_data = self._get_status_change_notification_data(
            old_status, 
            new_status,
            application,
            message
        )
        
        # Send email notification
        self.send_email(
            db,
            recipient_id=candidate.user_id,
            subject=notification_data["subject"],
            body=notification_data["body"],
            template_type="application_status_update",
            context={
                "candidate_name": candidate.user.full_name,
                "job_title": application.job.title,
                "company_name": application.job.company.name,
                "old_status": old_status,
                "new_status": new_status,
                "message": message
            }
        )
        
        # Send in-app notification
        self._create_in_app_notification(
            db,
            user_id=candidate.user_id,
            title=notification_data["subject"],
            message=notification_data["summary"],
            type="application_update",
            data={"application_id": str(application.id)}
        )
    
    def notify_interview_scheduled(
        self, 
        db: Session, 
        *, 
        application: Application,
        interview_details: Dict[str, Any]
    ):
        """Send interview invitation notifications"""
        candidate = application.candidate
        
        # Create calendar invite
        calendar_data = self._create_calendar_invite(
            application,
            interview_details
        )
        
        # Send email with calendar invite
        self.send_email(
            db,
            recipient_id=candidate.user_id,
            subject=f"Interview Scheduled - {application.job.title}",
            body=self._render_interview_email(application, interview_details),
            template_type="interview_invitation",
            attachments=[calendar_data],
            context={
                "candidate_name": candidate.user.full_name,
                "job_title": application.job.title,
                "company_name": application.job.company.name,
                "interview_date": interview_details["date"],
                "interview_time": interview_details["time"],
                "interview_type": interview_details["type"],
                "location": interview_details.get("location", "TBD"),
                "interviewer": interview_details.get("interviewer", "Hiring Team")
            }
        )
        
        # Send reminder SMS if enabled
        if self._has_sms_enabled(db, candidate.user_id):
            self._schedule_interview_reminder(
                db,
                application,
                interview_details
            )
    
    def notify_offer_made(
        self, 
        db: Session, 
        *, 
        application: Application,
        offer_details: Dict[str, Any]
    ):
        """Send job offer notifications"""
        candidate = application.candidate
        
        # Generate offer letter
        offer_letter = self._generate_offer_letter(
            db,
            application,
            offer_details
        )
        
        # Send email with offer
        self.send_email(
            db,
            recipient_id=candidate.user_id,
            subject=f"Job Offer - {application.job.title} at {application.job.company.name}",
            body=offer_letter["body"],
            template_type="job_offer",
            attachments=[offer_letter["pdf"]],
            priority="high",
            context={
                "candidate_name": candidate.user.full_name,
                "job_title": application.job.title,
                "company_name": application.job.company.name,
                "salary": offer_details["salary"],
                "start_date": offer_details["start_date"],
                "expiry_date": offer_details["expiry_date"]
            }
        )
        
        # Send SMS notification
        if self._has_sms_enabled(db, candidate.user_id):
            self.send_sms(
                db,
                recipient_id=candidate.user_id,
                message=f"Congratulations! You have received a job offer for {application.job.title}. Check your email for details."
            )
    
    # Job Notifications
    
    def notify_job_matches(
        self, 
        db: Session, 
        *, 
        candidate_id: UUID,
        matching_jobs: List[Job]
    ):
        """Notify candidate about matching job opportunities"""
        candidate = db.query(CandidateProfile).filter(
            CandidateProfile.id == candidate_id
        ).first()
        
        if not candidate:
            return
        
        # Check notification preferences
        if not self._should_notify_candidate(db, candidate_id, "job_matches"):
            return
        
        # Prepare job matches data
        jobs_data = [
            {
                "title": job.title,
                "company": job.company.name,
                "location": job.location,
                "salary_range": f"{job.salary_min}-{job.salary_max}" if job.salary_min else "Competitive",
                "url": f"{settings.FRONTEND_URL}/jobs/{job.id}"
            }
            for job in matching_jobs[:5]  # Limit to top 5
        ]
        
        # Send email
        self.send_email(
            db,
            recipient_id=candidate.user_id,
            subject=f"New Job Matches for You - {len(matching_jobs)} Opportunities",
            body=self._render_job_matches_email(candidate, jobs_data),
            template_type="job_matches",
            context={
                "candidate_name": candidate.user.full_name,
                "job_count": len(matching_jobs),
                "jobs": jobs_data
            }
        )
    
    # Consultant Notifications
    
    def notify_consultant_assignment(
        self, 
        db: Session, 
        *, 
        consultant_id: UUID,
        assignment_type: str,  # "candidate" or "client"
        assignment_id: UUID,
        assignment_details: Dict[str, Any]
    ):
        """Notify consultant about new assignment"""
        from app.models.consultant import ConsultantProfile
        
        consultant = db.query(ConsultantProfile).filter(
            ConsultantProfile.id == consultant_id
        ).first()
        
        if not consultant:
            return
        
        # Prepare notification based on type
        if assignment_type == "candidate":
            subject = "New Candidate Assignment"
            message = f"You have been assigned to work with candidate {assignment_details.get('candidate_name')}"
        else:
            subject = "New Client Assignment"
            message = f"You have been assigned to work with {assignment_details.get('company_name')}"
        
        # Send email
        self.send_email(
            db,
            recipient_id=consultant.user_id,
            subject=subject,
            body=self._render_assignment_email(consultant, assignment_type, assignment_details),
            template_type="consultant_assignment",
            priority="high"
        )
        
        # Create in-app notification
        self._create_in_app_notification(
            db,
            user_id=consultant.user_id,
            title=subject,
            message=message,
            type="assignment",
            data={
                "assignment_type": assignment_type,
                "assignment_id": str(assignment_id)
            }
        )
    
    def notify_consultant_target_achievement(
        self, 
        db: Session, 
        *, 
        consultant_id: UUID,
        target_type: str,
        achievement_percentage: float
    ):
        """Notify consultant about target achievement"""
        from app.models.consultant import ConsultantProfile
        
        consultant = db.query(ConsultantProfile).filter(
            ConsultantProfile.id == consultant_id
        ).first()
        
        if not consultant:
            return
        
        # Determine notification based on achievement
        if achievement_percentage >= 100:
            subject = f"Congratulations! {target_type} Target Achieved"
            message = f"You have achieved {achievement_percentage}% of your {target_type} target!"
            priority = "high"
        elif achievement_percentage >= 80:
            subject = f"Almost There! {achievement_percentage}% of {target_type} Target"
            message = f"You're close to achieving your {target_type} target. Keep going!"
            priority = "medium"
        else:
            return  # Don't notify for lower achievements
        
        # Send notification
        self.send_email(
            db,
            recipient_id=consultant.user_id,
            subject=subject,
            body=message,
            template_type="target_achievement",
            priority=priority
        )
    
    # Admin Notifications
    
    def notify_admins_security_alert(
        self, 
        db: Session, 
        *, 
        alert_type: str,
        severity: str,
        details: Dict[str, Any]
    ):
        """Send security alert to all admins"""
        from app.models.admin import AdminProfile, SuperAdminProfile
        
        # Get all active admins and superadmins
        admins = db.query(AdminProfile).filter(
            AdminProfile.status == "active"
        ).all()
        
        superadmins = db.query(SuperAdminProfile).all()
        
        # Prepare alert message
        alert_data = {
            "type": alert_type,
            "severity": severity,
            "timestamp": datetime.utcnow().isoformat(),
            "details": details
        }
        
        # Send to all admins
        for admin in admins:
            self.send_email(
                db,
                recipient_id=admin.user_id,
                subject=f"SECURITY ALERT: {alert_type}",
                body=self._render_security_alert_email(alert_data),
                template_type="security_alert",
                priority="critical"
            )
        
        # Send to superadmins with additional details
        for superadmin in superadmins:
            self.send_email(
                db,
                recipient_id=superadmin.user_id,
                subject=f"CRITICAL SECURITY ALERT: {alert_type}",
                body=self._render_security_alert_email(alert_data, detailed=True),
                template_type="security_alert",
                priority="critical"
            )
    
    # Core Notification Methods
    
    def send_email(
        self, 
        db: Session, 
        *, 
        recipient_id: UUID,
        subject: str,
        body: str,
        template_type: Optional[str] = None,
        template_id: Optional[UUID] = None,
        context: Optional[Dict[str, Any]] = None,
        attachments: Optional[List[Dict[str, Any]]] = None,
        priority: str = "normal",
        schedule_time: Optional[datetime] = None
    ) -> bool:
        """Send email notification"""
        # Get recipient
        recipient = db.query(User).filter(User.id == recipient_id).first()
        if not recipient:
            return False
        
        # Use template if provided
        if template_id:
            template = db.query(EmailTemplate).filter(
                EmailTemplate.id == template_id
            ).first()
            if template:
                subject = self._render_template(template.subject, context or {})
                body = self._render_template(template.body, context or {})
        
        # Create email message
        email_data = {
            "to": recipient.email,
            "subject": subject,
            "body": body,
            "html_body": self._convert_to_html(body),
            "attachments": attachments or [],
            "priority": priority,
            "metadata": {
                "recipient_id": str(recipient_id),
                "template_type": template_type,
                "sent_at": datetime.utcnow().isoformat()
            }
        }
        
        # Schedule or send immediately
        if schedule_time and schedule_time > datetime.utcnow():
            self._schedule_email(email_data, schedule_time)
        else:
            self._send_email_immediate(email_data)
        
        # Log email sent
        self._log_notification(
            db,
            user_id=recipient_id,
            type="email",
            subject=subject,
            status="sent"
        )
        
        return True
    
    def send_sms(
        self, 
        db: Session, 
        *, 
        recipient_id: UUID,
        message: str,
        priority: str = "normal"
    ) -> bool:
        """Send SMS notification"""
        # Get recipient phone
        recipient = db.query(User).filter(User.id == recipient_id).first()
        if not recipient or not recipient.phone:
            return False
        
        # Check SMS preferences
        if not self._has_sms_enabled(db, recipient_id):
            return False
        
        # Create SMS data
        sms_data = {
            "to": recipient.phone,
            "message": message[:160],  # SMS character limit
            "priority": priority
        }
        
        # Send SMS
        self._send_sms_immediate(sms_data)
        
        # Log SMS sent
        self._log_notification(
            db,
            user_id=recipient_id,
            type="sms",
            subject="SMS",
            status="sent"
        )
        
        return True
    
    def send_push_notification(
        self, 
        db: Session, 
        *, 
        recipient_id: UUID,
        title: str,
        message: str,
        data: Optional[Dict[str, Any]] = None,
        priority: str = "normal"
    ) -> bool:
        """Send push notification"""
        # Get user device tokens
        device_tokens = self._get_user_device_tokens(db, recipient_id)
        if not device_tokens:
            return False
        
        # Create push data
        push_data = {
            "tokens": device_tokens,
            "title": title,
            "body": message,
            "data": data or {},
            "priority": priority
        }
        
        # Send push notification
        self._send_push_immediate(push_data)
        
        # Log push sent
        self._log_notification(
            db,
            user_id=recipient_id,
            type="push",
            subject=title,
            status="sent"
        )
        
        return True
    
    def send_bulk_notification(
        self, 
        db: Session, 
        *, 
        recipient_ids: List[UUID],
        subject: str,
        body: str,
        channels: List[str] = ["email"],
        template_type: Optional[str] = None
    ) -> Dict[str, int]:
        """Send bulk notifications to multiple recipients"""
        results = {
            "total": len(recipient_ids),
            "sent": 0,
            "failed": 0
        }
        
        for recipient_id in recipient_ids:
            try:
                success = False
                
                if "email" in channels:
                    success = self.send_email(
                        db,
                        recipient_id=recipient_id,
                        subject=subject,
                        body=body,
                        template_type=template_type
                    )
                
                if "sms" in channels:
                    self.send_sms(
                        db,
                        recipient_id=recipient_id,
                        message=body[:160]
                    )
                
                if "push" in channels:
                    self.send_push_notification(
                        db,
                        recipient_id=recipient_id,
                        title=subject,
                        message=body[:100]
                    )
                
                if success:
                    results["sent"] += 1
                else:
                    results["failed"] += 1
                    
            except Exception:
                results["failed"] += 1
        
        return results
    
    # Helper Methods
    
    def _should_notify_candidate(
        self, 
        db: Session, 
        candidate_id: UUID,
        notification_type: str
    ) -> bool:
        """Check if candidate should receive notification"""
        settings = db.query(CandidateNotificationSettings).filter(
            CandidateNotificationSettings.candidate_id == candidate_id
        ).first()
        
        if not settings:
            return True  # Default to sending
        
        if notification_type == "job_matches":
            return settings.job_matches
        elif notification_type == "application_updates":
            return settings.application_updates
        else:
            return settings.email_alerts
    
    def _has_sms_enabled(self, db: Session, user_id: UUID) -> bool:
        """Check if user has SMS notifications enabled"""
        # This would check user preferences
        # For now, return False as SMS requires setup
        return False
    
    def _get_user_device_tokens(
        self, 
        db: Session, 
        user_id: UUID
    ) -> List[str]:
        """Get user's device tokens for push notifications"""
        # This would retrieve from user device registrations
        return []
    
    def _create_in_app_notification(
        self,
        db: Session,
        user_id: UUID,
        title: str,
        message: str,
        type: str,
        data: Optional[Dict[str, Any]] = None
    ):
        """Create in-app notification"""
        # This would create a notification in the database
        # that appears in the user's notification center
        from app.models.messaging import Message, Conversation
        
        # For now, create as system message
        system_conversation = self._get_or_create_system_conversation(db, user_id)
        
        message = Message(
            conversation_id=system_conversation.id,
            sender_id=user_id,  # System sends as user
            content=f"{title}\n\n{message}",
            message_type="system",
            is_system_message=True,
            metadata=data
        )
        db.add(message)
        db.commit()
    
    def _get_status_change_notification_data(
        self,
        old_status: ApplicationStatus,
        new_status: ApplicationStatus,
        application: Application,
        message: Optional[str]
    ) -> Dict[str, str]:
        """Get notification content for status change"""
        job_title = application.job.title
        company_name = application.job.company.name
        
        if new_status == ApplicationStatus.UNDER_REVIEW:
            return {
                "subject": f"Application Under Review - {job_title}",
                "summary": f"Your application for {job_title} at {company_name} is being reviewed",
                "body": self._get_under_review_body(application, message)
            }
        elif new_status == ApplicationStatus.INTERVIEWED:
            return {
                "subject": f"Interview Update - {job_title}",
                "summary": f"Interview scheduled for {job_title} at {company_name}",
                "body": self._get_interview_body(application, message)
            }
        elif new_status == ApplicationStatus.OFFERED:
            return {
                "subject": f"Job Offer - {job_title}",
                "summary": f"Congratulations! You have an offer from {company_name}",
                "body": self._get_offer_body(application, message)
            }
        elif new_status == ApplicationStatus.REJECTED:
            return {
                "subject": f"Application Update - {job_title}",
                "summary": f"Update on your application to {company_name}",
                "body": self._get_rejection_body(application, message)
            }
        else:
            return {
                "subject": f"Application Status Update - {job_title}",
                "summary": f"Your application status has changed to {new_status}",
                "body": message or "Your application status has been updated."
            }
    
    def _render_template(
        self, 
        template: str, 
        context: Dict[str, Any]
    ) -> str:
        """Render template with context"""
        for key, value in context.items():
            template = template.replace(f"{{{{{key}}}}}", str(value))
        return template
    
    def _convert_to_html(self, text: str) -> str:
        """Convert plain text to HTML"""
        # Basic conversion
        html = text.replace('\n', '<br>')
        return f"<html><body>{html}</body></html>"
    
    def _send_email_immediate(self, email_data: Dict[str, Any]):
        """Send email immediately"""
        # This would integrate with email service
        # For now, add to queue
        self.email_queue.append(email_data)
    
    def _send_sms_immediate(self, sms_data: Dict[str, Any]):
        """Send SMS immediately"""
        # This would integrate with SMS service
        # For now, add to queue
        self.sms_queue.append(sms_data)
    
    def _send_push_immediate(self, push_data: Dict[str, Any]):
        """Send push notification immediately"""
        # This would integrate with push service
        # For now, add to queue
        self.push_queue.append(push_data)
    
    def _schedule_email(
        self, 
        email_data: Dict[str, Any], 
        schedule_time: datetime
    ):
        """Schedule email for later sending"""
        # This would integrate with job scheduler
        pass
    
    def _log_notification(
        self,
        db: Session,
        user_id: UUID,
        type: str,
        subject: str,
        status: str
    ):
        """Log notification for tracking"""
        # This would create notification log entry
        pass
    
    def _create_calendar_invite(
        self,
        application: Application,
        interview_details: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Create calendar invite for interview"""
        # This would create ICS file
        return {
            "filename": "interview_invite.ics",
            "content": "Calendar invite content",
            "mime_type": "text/calendar"
        }
    
    def _render_interview_email(
        self,
        application: Application,
        interview_details: Dict[str, Any]
    ) -> str:
        """Render interview invitation email"""
        return f"""
Dear {application.candidate.user.full_name},

We are pleased to invite you for an interview for the {application.job.title} position at {application.job.company.name}.

Interview Details:
- Date: {interview_details['date']}
- Time: {interview_details['time']}
- Type: {interview_details['type']}
- Location: {interview_details.get('location', 'Details to follow')}

Please confirm your attendance by replying to this email.

Best regards,
{application.job.company.name} Hiring Team
"""
    
    def _schedule_interview_reminder(
        self,
        db: Session,
        application: Application,
        interview_details: Dict[str, Any]
    ):
        """Schedule interview reminder"""
        # Schedule SMS 24 hours before
        reminder_time = interview_details['date'] - timedelta(hours=24)
        
        # This would integrate with scheduler
        pass
    
    def _generate_offer_letter(
        self,
        db: Session,
        application: Application,
        offer_details: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate offer letter"""
        # This would generate PDF offer letter
        return {
            "body": self._render_offer_letter_body(application, offer_details),
            "pdf": {
                "filename": "offer_letter.pdf",
                "content": b"PDF content",
                "mime_type": "application/pdf"
            }
        }
    
    def _render_offer_letter_body(
        self,
        application: Application,
        offer_details: Dict[str, Any]
    ) -> str:
        """Render offer letter body"""
        return f"""
Dear {application.candidate.user.full_name},

We are delighted to offer you the position of {application.job.title} at {application.job.company.name}.

Offer Details:
- Salary: {offer_details['currency']} {offer_details['salary']}
- Start Date: {offer_details['start_date']}
- Benefits: {', '.join(offer_details.get('benefits', ['Comprehensive package']))}

This offer is valid until {offer_details['expiry_date']}.

We look forward to welcoming you to our team!

Best regards,
{application.job.company.name}
"""
    
    def _render_job_matches_email(
        self,
        candidate: CandidateProfile,
        jobs_data: List[Dict[str, Any]]
    ) -> str:
        """Render job matches email"""
        jobs_list = "\n".join([
            f"- {job['title']} at {job['company']} ({job['location']}) - {job['salary_range']}"
            for job in jobs_data
        ])
        
        return f"""
Hi {candidate.user.first_name},

We found {len(jobs_data)} job opportunities that match your profile:

{jobs_list}

Visit your dashboard to view more details and apply.

Best regards,
The Recruitment Team
"""
    
    def _render_assignment_email(
        self,
        consultant: Any,
        assignment_type: str,
        details: Dict[str, Any]
    ) -> str:
        """Render consultant assignment email"""
        if assignment_type == "candidate":
            return f"""
Dear {consultant.user.full_name},

You have been assigned to work with a new candidate:
- Name: {details.get('candidate_name')}
- Position: {details.get('position')}
- Skills: {', '.join(details.get('skills', [])[:5])}

Please review their profile and reach out within 24 hours.

Best regards,
Management Team
"""
        else:
            return f"""
Dear {consultant.user.full_name},

You have been assigned as the primary consultant for:
- Company: {details.get('company_name')}
- Industry: {details.get('industry')}
- Current Openings: {details.get('open_positions', 0)}

Please schedule an introductory call with the client.

Best regards,
Management Team
"""
    
    def _render_security_alert_email(
        self,
        alert_data: Dict[str, Any],
        detailed: bool = False
    ) -> str:
        """Render security alert email"""
        base_content = f"""
SECURITY ALERT

Type: {alert_data['type']}
Severity: {alert_data['severity']}
Time: {alert_data['timestamp']}

Description: {alert_data['details'].get('description', 'Security incident detected')}

Immediate action may be required.
"""
        
        if detailed:
            base_content += f"""

Detailed Information:
{json.dumps(alert_data['details'], indent=2)}

Please investigate immediately and take appropriate action.
"""
        
        return base_content
    
    def _get_or_create_system_conversation(
        self,
        db: Session,
        user_id: UUID
    ) -> Conversation:
        """Get or create system conversation for user"""
        from app.models.messaging import Conversation, ConversationType
        
        # Find existing system conversation
        conversation = db.query(Conversation).filter(
            Conversation.created_by_id == user_id,
            Conversation.type == ConversationType.SYSTEM
        ).first()
        
        if not conversation:
            conversation = Conversation(
                title="System Notifications",
                type=ConversationType.SYSTEM,
                created_by_id=user_id,
                is_private=True
            )
            db.add(conversation)
            db.commit()
        
        return conversation
    
    def _get_under_review_body(
        self,
        application: Application,
        message: Optional[str]
    ) -> str:
        """Get email body for under review status"""
        return f"""
Your application for {application.job.title} at {application.job.company.name} is being reviewed by our team.

We will contact you soon with next steps.

{message or ''}

Best regards,
The Hiring Team
"""
    
    def _get_interview_body(
        self,
        application: Application,
        message: Optional[str]
    ) -> str:
        """Get email body for interview status"""
        return f"""
Congratulations! You have been selected for an interview for the {application.job.title} position at {application.job.company.name}.

We will contact you shortly to schedule the interview.

{message or ''}

Best regards,
The Hiring Team
"""
    
    def _get_offer_body(
        self,
        application: Application,
        message: Optional[str]
    ) -> str:
        """Get email body for offer status"""
        return f"""
Congratulations! We are pleased to offer you the {application.job.title} position at {application.job.company.name}.

Please check your email for the detailed offer letter.

{message or ''}

Best regards,
The Hiring Team
"""
    
    def _get_rejection_body(
        self,
        application: Application,
        message: Optional[str]
    ) -> str:
        """Get email body for rejection status"""
        return f"""
Thank you for your interest in the {application.job.title} position at {application.job.company.name}.

After careful consideration, we have decided to move forward with other candidates whose experience more closely matches our current needs.

{message or 'We appreciate your time and interest in our company. We encourage you to apply for future opportunities that match your skills and experience.'}

Best regards,
The Hiring Team
"""
    
    # Process notification queues (would run as background tasks)
    
    async def process_email_queue(self):
        """Process email queue"""
        while self.email_queue:
            email = self.email_queue.pop(0)
            # Send via email service
            await asyncio.sleep(0.1)  # Rate limiting
    
    async def process_sms_queue(self):
        """Process SMS queue"""
        while self.sms_queue:
            sms = self.sms_queue.pop(0)
            # Send via SMS service
            await asyncio.sleep(0.5)  # Rate limiting
    
    async def process_push_queue(self):
        """Process push notification queue"""
        while self.push_queue:
            push = self.push_queue.pop(0)
            # Send via push service
            await asyncio.sleep(0.1)  # Rate limiting


# Create service instance
notification_service = NotificationService()