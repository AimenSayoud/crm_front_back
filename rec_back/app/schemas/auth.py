from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from uuid import UUID
from app.models.enums import UserRole

# Request schemas
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    role: Optional[UserRole] = UserRole.CANDIDATE
    phone: Optional[str] = None

# Response schemas
class UserResponse(BaseModel):
    id: UUID
    email: str
    first_name: str
    last_name: str
    role: UserRole
    is_active: bool
    is_verified: bool
    phone: Optional[str] = None
    created_at: datetime
    last_login: Optional[datetime] = None
    
    # Computed field for backwards compatibility
    @property
    def name(self) -> str:
        return f"{self.first_name} {self.last_name}"

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int

class LoginResponse(BaseModel):
    user: UserResponse
    tokens: TokenResponse

class RefreshResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int

class AuthStatusResponse(BaseModel):
    is_authenticated: bool
    user: Optional[UserResponse] = None