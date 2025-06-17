# app/services/auth.py
from typing import Optional, Dict, Any, Tuple
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from passlib.context import CryptContext
from uuid import UUID
import secrets
import string

from app.models.user import User
from app.models.enums import UserRole
from app.schemas.auth import (
    RegisterRequest, LoginRequest, TokenResponse, 
    UserResponse, RefreshTokenRequest
)
from app.core.config import settings
from app.core.security import create_access_token, create_refresh_token
from app.crud.base import CRUDBase


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class AuthService:
    """Service for authentication and authorization operations"""
    
    def __init__(self):
        self.pwd_context = pwd_context
        self.user_crud = CRUDBase(User)
    
    def authenticate_user(
        self, 
        db: Session, 
        *, 
        email: str, 
        password: str
    ) -> Optional[User]:
        """Authenticate user with email and password"""
        user = db.query(User).filter(User.email == email).first()
        if not user:
            return None
        if not self.verify_password(password, user.password_hash):
            return None
        if not user.is_active:
            return None
        return user
    
    def register_user(
        self, 
        db: Session, 
        *, 
        user_data: RegisterRequest
    ) -> Tuple[User, TokenResponse]:
        """Register a new user and return tokens"""
        # Check if user exists
        if self.get_user_by_email(db, email=user_data.email):
            raise ValueError("Email already registered")
        
        # Create user
        hashed_password = self.get_password_hash(user_data.password)
        user = User(
            email=user_data.email,
            password_hash=hashed_password,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            role=user_data.role or UserRole.CANDIDATE,
            is_active=True,
            is_verified=False
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # Generate tokens
        tokens = self.create_tokens(user)
        
        # Create profile based on role
        self._create_role_profile(db, user)
        
        return user, tokens
    
    def login(
        self, 
        db: Session, 
        *, 
        login_data: LoginRequest
    ) -> Tuple[User, TokenResponse]:
        """Login user and return tokens"""
        user = self.authenticate_user(
            db, 
            email=login_data.email, 
            password=login_data.password
        )
        if not user:
            raise ValueError("Incorrect email or password")
        
        # Update last login
        user.last_login = datetime.utcnow()
        db.commit()
        
        # Generate tokens
        tokens = self.create_tokens(user)
        
        # Log login for admin users
        if user.role in [UserRole.ADMIN, UserRole.SUPERADMIN]:
            self._log_admin_login(db, user)
        
        return user, tokens
    
    def refresh_token(
        self, 
        db: Session, 
        *, 
        refresh_data: RefreshTokenRequest
    ) -> TokenResponse:
        """Refresh access token using refresh token"""
        try:
            payload = jwt.decode(
                refresh_data.refresh_token,
                settings.SECRET_KEY,
                algorithms=[settings.ALGORITHM]
            )
            user_id = payload.get("sub")
            if not user_id:
                raise ValueError("Invalid refresh token")
            
            user = db.query(User).filter(User.id == user_id).first()
            if not user or not user.is_active:
                raise ValueError("User not found or inactive")
            
            # Create new tokens
            return self.create_tokens(user)
            
        except JWTError:
            raise ValueError("Invalid refresh token")
    
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify password against hash"""
        return self.pwd_context.verify(plain_password, hashed_password)
    
    def get_password_hash(self, password: str) -> str:
        """Hash password"""
        return self.pwd_context.hash(password)
    
    def create_tokens(self, user: User) -> TokenResponse:
        """Create access and refresh tokens for user"""
        access_token = create_access_token(
            data={"sub": str(user.id), "role": user.role}
        )
        refresh_token = create_refresh_token(
            data={"sub": str(user.id)}
        )
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )
    
    def get_user_by_email(
        self, 
        db: Session, 
        *, 
        email: str
    ) -> Optional[User]:
        """Get user by email"""
        return db.query(User).filter(User.email == email).first()
    
    def verify_email_token(
        self, 
        db: Session, 
        *, 
        token: str
    ) -> Optional[User]:
        """Verify email verification token"""
        try:
            payload = jwt.decode(
                token,
                settings.SECRET_KEY,
                algorithms=[settings.ALGORITHM]
            )
            user_id = payload.get("sub")
            action = payload.get("action")
            
            if not user_id or action != "email_verification":
                return None
            
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                user.is_verified = True
                db.commit()
                return user
            
        except JWTError:
            pass
        
        return None
    
    def create_password_reset_token(
        self, 
        db: Session, 
        *, 
        email: str
    ) -> Optional[str]:
        """Create password reset token"""
        user = self.get_user_by_email(db, email=email)
        if not user:
            return None
        
        token_data = {
            "sub": str(user.id),
            "action": "password_reset",
            "exp": datetime.utcnow() + timedelta(hours=1)
        }
        
        return jwt.encode(
            token_data,
            settings.SECRET_KEY,
            algorithm=settings.ALGORITHM
        )
    
    def reset_password(
        self, 
        db: Session, 
        *, 
        token: str, 
        new_password: str
    ) -> Optional[User]:
        """Reset password using token"""
        try:
            payload = jwt.decode(
                token,
                settings.SECRET_KEY,
                algorithms=[settings.ALGORITHM]
            )
            user_id = payload.get("sub")
            action = payload.get("action")
            
            if not user_id or action != "password_reset":
                return None
            
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                user.password_hash = self.get_password_hash(new_password)
                db.commit()
                return user
            
        except JWTError:
            pass
        
        return None
    
    def generate_temp_password(self, length: int = 12) -> str:
        """Generate temporary password"""
        alphabet = string.ascii_letters + string.digits + string.punctuation
        return ''.join(secrets.choice(alphabet) for _ in range(length))
    
    def change_password(
        self, 
        db: Session, 
        *, 
        user_id: UUID,
        current_password: str,
        new_password: str
    ) -> bool:
        """Change user password"""
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return False
        
        if not self.verify_password(current_password, user.password_hash):
            return False
        
        user.password_hash = self.get_password_hash(new_password)
        db.commit()
        return True
    
    def _create_role_profile(self, db: Session, user: User):
        """Create role-specific profile after registration"""
        if user.role == UserRole.CANDIDATE:
            from app.models.candidate import CandidateProfile
            profile = CandidateProfile(user_id=user.id)
            db.add(profile)
        elif user.role == UserRole.EMPLOYER:
            # Employer needs to be associated with a company
            pass
        elif user.role == UserRole.CONSULTANT:
            from app.models.consultant import ConsultantProfile
            profile = ConsultantProfile(
                user_id=user.id,
                status="inactive"  # Needs admin approval
            )
            db.add(profile)
        
        db.commit()
    
    def _log_admin_login(self, db: Session, user: User):
        """Log admin login for audit"""
        from app.models.admin import AdminAuditLog
        if user.role == UserRole.ADMIN and hasattr(user, 'admin_profile'):
            log = AdminAuditLog(
                admin_id=user.admin_profile.id,
                action_type="login",
                status="success",
                ip_address="",  # Should be passed from request
                user_agent=""   # Should be passed from request
            )
            db.add(log)
            db.commit()


# Create service instance
auth_service = AuthService()