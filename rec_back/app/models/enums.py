import enum


class ContractType(str, enum.Enum):
    PERMANENT = "Permanent"
    CONTRACT = "Contract"
    FREELANCE = "Freelance"
    INTERNSHIP = "Internship"
    TEMPORARY = "Temporary"


class ProficiencyLevel(str, enum.Enum):
    BEGINNER = "Beginner"
    INTERMEDIATE = "Intermediate"
    ADVANCED = "Advanced"
    EXPERT = "Expert"


class JobStatus(str, enum.Enum):
    DRAFT = "draft"
    OPEN = "open"
    CLOSED = "closed"
    FILLED = "filled"
    CANCELLED = "cancelled"


class JobType(str, enum.Enum):
    FULL_TIME = "full_time"
    PART_TIME = "part_time"
    CONTRACT = "contract"
    FREELANCE = "freelance"
    INTERNSHIP = "internship"
    TEMPORARY = "temporary"


class ExperienceLevel(str, enum.Enum):
    ENTRY_LEVEL = "entry_level"
    JUNIOR = "junior"
    MID_LEVEL = "mid_level"
    SENIOR = "senior"
    LEAD = "lead"
    PRINCIPAL = "principal"


class UserRole(str, enum.Enum):
    CANDIDATE = "candidate"
    EMPLOYER = "employer"
    CONSULTANT = "consultant"
    ADMIN = "admin"
    SUPERADMIN = "superadmin"


class OfficeId(str, enum.Enum):
    OFFICE_1 = "office_1"
    OFFICE_2 = "office_2"
    OFFICE_3 = "office_3"
    HEADQUARTERS = "headquarters"
    REMOTE = "remote"


class ApplicationStatus(str, enum.Enum):
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    INTERVIEWED = "interviewed"
    OFFERED = "offered"
    HIRED = "hired"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"
    # Legacy values for backward compatibility
    UNDER_REVIEW_RECRUITMENTPLUS = "under_review_recruitmentplus"
    PRESENTED_TO_EMPLOYER = "presented_to_employer"
    INTERVIEW_SCHEDULED = "interview_scheduled"
    OFFER_MADE = "offer_made"


class CompanySize(str, enum.Enum):
    SMALL = "1-10"
    MEDIUM_SMALL = "10-50"
    MEDIUM = "50-200"
    LARGE = "200-1000"
    ENTERPRISE = "1000+"


# Admin related enums
class AdminStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"


class AdminRole(str, enum.Enum):
    SYSTEM_ADMIN = "system_admin"
    USER_ADMIN = "user_admin"
    CONTENT_ADMIN = "content_admin"
    FINANCE_ADMIN = "finance_admin"
    SUPPORT_ADMIN = "support_admin"


class PermissionLevel(str, enum.Enum):
    READ = "read"
    WRITE = "write"
    DELETE = "delete"
    FULL_ACCESS = "full_access"


# Consultant related enums
class ConsultantStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    ON_LEAVE = "on_leave"
    SUSPENDED = "suspended"


# Messaging related enums
class MessageType(str, enum.Enum):
    TEXT = "text"
    FILE = "file"
    IMAGE = "image"
    SYSTEM = "system"
    TEMPLATE = "template"


class MessageStatus(str, enum.Enum):
    SENT = "sent"
    DELIVERED = "delivered"
    READ = "read"
    FAILED = "failed"


class ConversationType(str, enum.Enum):
    DIRECT = "direct"
    GROUP = "group"
    BROADCAST = "broadcast"
    SYSTEM = "system"