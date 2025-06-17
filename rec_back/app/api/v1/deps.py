from typing import Generator, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from uuid import UUID

from app.db.session import get_db
from app.core.config import settings
from app.models.user import User
from app.models.enums import UserRole
from app.models.candidate import CandidateProfile
from app.models.company import EmployerProfile
from app.models.consultant import ConsultantProfile
from app.models.admin import AdminProfile, SuperAdminProfile

# Type aliases for compatibility
CurrentUser = User

# Security
security = HTTPBearer()

# Database dependency (import directly from session)
def get_database() -> Generator:
    """Database dependency"""
    from app.db.session import SessionLocal
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Authentication dependencies
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_database)
) -> User:
    """Get current authenticated user from JWT token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        # Check token type if present (for compatibility with security.py tokens)
        token_type = payload.get("type")
        if token_type is not None and token_type != "access":
            raise credentials_exception
            
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    
    return user

async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """Get current active user"""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    return current_user

# Role-based dependencies
def require_roles(*roles: UserRole):
    """Decorator to require specific roles"""
    def role_checker(
        current_user: User = Depends(get_current_active_user)
    ) -> User:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
        return current_user
    return role_checker

# Specific role dependencies
def get_candidate_user(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """Ensure current user is a candidate"""
    if current_user.role != UserRole.CANDIDATE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Candidate access required"
        )
    return current_user

def get_employer_user(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """Ensure current user is an employer"""
    if current_user.role != UserRole.EMPLOYER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Employer access required"
        )
    return current_user

def get_consultant_user(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """Ensure current user is a consultant"""
    if current_user.role != UserRole.CONSULTANT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Consultant access required"
        )
    return current_user

def get_admin_user(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """Ensure current user is an admin"""
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user

def get_superadmin_user(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """Ensure current user is a superadmin"""
    if current_user.role != UserRole.SUPERADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin access required"
        )
    return current_user

# Profile dependencies
def get_candidate_profile(
    current_user: User = Depends(get_candidate_user),
    db: Session = Depends(get_database)
) -> CandidateProfile:
    """Get candidate profile for current user"""
    profile = db.query(CandidateProfile).filter(
        CandidateProfile.user_id == current_user.id
    ).first()
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate profile not found"
        )
    
    return profile

def get_employer_profile(
    current_user: User = Depends(get_employer_user),
    db: Session = Depends(get_database)
) -> EmployerProfile:
    """Get employer profile for current user"""
    profile = db.query(EmployerProfile).filter(
        EmployerProfile.user_id == current_user.id
    ).first()
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employer profile not found"
        )
    
    return profile

def get_consultant_profile(
    current_user: User = Depends(get_consultant_user),
    db: Session = Depends(get_database)
) -> ConsultantProfile:
    """Get consultant profile for current user"""
    profile = db.query(ConsultantProfile).filter(
        ConsultantProfile.user_id == current_user.id
    ).first()
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Consultant profile not found"
        )
    
    return profile

# Permission checking helpers
def check_resource_ownership(
    resource_user_id: UUID,
    current_user: User,
    allow_admin: bool = True
) -> bool:
    """Check if user owns resource or is admin"""
    if str(resource_user_id) == str(current_user.id):
        return True
    
    if allow_admin and current_user.role in [UserRole.ADMIN, UserRole.SUPERADMIN]:
        return True
    
    return False

def check_company_access(
    company_id: UUID,
    current_user: User,
    db: Session
) -> bool:
    """Check if user has access to company resources"""
    if current_user.role in [UserRole.ADMIN, UserRole.SUPERADMIN]:
        return True
    
    if current_user.role == UserRole.EMPLOYER:
        # Check if user is associated with this company
        employer_profile = db.query(EmployerProfile).filter(
            EmployerProfile.user_id == current_user.id,
            EmployerProfile.company_id == company_id
        ).first()
        return employer_profile is not None
    
    return False

def check_candidate_access(
    candidate_id: UUID,
    current_user: User,
    db: Session
) -> bool:
    """Check if user has access to candidate resources"""
    if current_user.role in [UserRole.ADMIN, UserRole.SUPERADMIN]:
        return True
    
    # Candidate accessing own profile
    if current_user.role == UserRole.CANDIDATE:
        candidate_profile = db.query(CandidateProfile).filter(
            CandidateProfile.id == candidate_id,
            CandidateProfile.user_id == current_user.id
        ).first()
        return candidate_profile is not None
    
    # Consultant or employer can access candidates they work with
    if current_user.role in [UserRole.CONSULTANT, UserRole.EMPLOYER]:
        return True  # This could be more restrictive based on business rules
    
    return False

# Optional user dependency (for public endpoints that can benefit from user context)
async def get_optional_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False)),
    db: Session = Depends(get_database)
) -> Optional[User]:
    """Get current user if token is provided, otherwise return None"""
    if not credentials:
        return None
    
    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        # Check token type if present (for compatibility with security.py tokens)
        token_type = payload.get("type")
        if token_type is not None and token_type != "access":
            return None
            
        user_id: str = payload.get("sub")
        if user_id is None:
            return None
        
        user = db.query(User).filter(User.id == user_id).first()
        if user and user.is_active:
            return user
    except JWTError:
        pass
    
    return None

# Pagination dependency
class PaginationParams:
    def __init__(
        self,
        page: int = 1,
        page_size: int = 50,
        max_page_size: int = 100
    ):
        self.page = max(1, page)
        self.page_size = min(max_page_size, max(1, page_size))
        self.offset = (self.page - 1) * self.page_size

def get_pagination_params(
    page: int = 1,
    page_size: int = 50
) -> PaginationParams:
    """Get pagination parameters"""
    return PaginationParams(page=page, page_size=page_size)

# Common query parameters
class CommonFilters:
    def __init__(
        self,
        q: Optional[str] = None,  # Search query
        sort_by: Optional[str] = None,
        sort_order: str = "desc",
        created_after: Optional[str] = None,
        created_before: Optional[str] = None
    ):
        self.q = q
        self.sort_by = sort_by
        self.sort_order = sort_order.lower() if sort_order else "desc"
        self.created_after = created_after
        self.created_before = created_before

def get_common_filters(
    q: Optional[str] = None,
    sort_by: Optional[str] = None,
    sort_order: str = "desc",
    created_after: Optional[str] = None,
    created_before: Optional[str] = None
) -> CommonFilters:
    """Get common filter parameters"""
    return CommonFilters(
        q=q,
        sort_by=sort_by,
        sort_order=sort_order,
        created_after=created_after,
        created_before=created_before
    )

# Compatibility aliases
get_db = get_database
get_current_user_optional = get_optional_current_user

# Additional role-based dependencies
def get_current_consultant_or_admin(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """Ensure current user is a consultant or admin"""
    if current_user.role not in [UserRole.CONSULTANT, UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Consultant or admin access required"
        )
    return current_user