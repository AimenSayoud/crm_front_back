# app/api/v1/endpoints/auth.py
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.api.v1 import deps
from app.core import security
from app.core.config import settings
from app.schemas.auth import (
    LoginRequest, RegisterRequest, RefreshTokenRequest,
    LoginResponse, RefreshResponse, AuthStatusResponse, UserResponse
)
from app.services.auth import auth_service
from app.services.notification import notification_service

router = APIRouter()


@router.post("/register", response_model=LoginResponse)
def register(
    *,
    db: Session = Depends(deps.get_db),
    user_in: RegisterRequest,
    background_tasks: BackgroundTasks
) -> Any:
    """
    Register new user
    """
    try:
        user, tokens = auth_service.register_user(db, user_data=user_in)
        
        # Send welcome email in background
        background_tasks.add_task(
            notification_service.send_email,
            db,
            recipient_id=user.id,
            subject="Welcome to RecruitmentPlus",
            body=f"Welcome {user.first_name}! Your account has been created successfully.",
            template_type="welcome"
        )
        
        return LoginResponse(
            user=UserResponse.from_orm(user),
            tokens=tokens
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/login", response_model=LoginResponse)
def login(
    db: Session = Depends(deps.get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    try:
        user, tokens = auth_service.login(
            db,
            login_data=LoginRequest(
                email=form_data.username,
                password=form_data.password
            )
        )
        
        return LoginResponse(
            user=UserResponse.from_orm(user),
            tokens=tokens
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )


@router.post("/refresh", response_model=RefreshResponse)
def refresh_token(
    *,
    db: Session = Depends(deps.get_db),
    refresh_data: RefreshTokenRequest
) -> Any:
    """
    Refresh access token
    """
    try:
        tokens = auth_service.refresh_token(db, refresh_data=refresh_data)
        return RefreshResponse(
            access_token=tokens.access_token,
            token_type=tokens.token_type,
            expires_in=tokens.expires_in
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )


@router.get("/me", response_model=UserResponse)
def get_current_user(
    current_user: deps.CurrentUser = Depends(deps.get_current_active_user)
) -> Any:
    """
    Get current user
    """
    return current_user


@router.get("/status", response_model=AuthStatusResponse)
def auth_status(
    current_user: deps.CurrentUser = Depends(deps.get_current_user_optional)
) -> Any:
    """
    Check authentication status
    """
    if current_user:
        return AuthStatusResponse(
            is_authenticated=True,
            user=UserResponse.from_orm(current_user)
        )
    return AuthStatusResponse(is_authenticated=False)


@router.post("/logout")
def logout(
    current_user: deps.CurrentUser = Depends(deps.get_current_active_user)
) -> Any:
    """
    Logout user (client should discard tokens)
    """
    # In a real implementation, you might want to blacklist the token
    return {"message": "Successfully logged out"}


@router.post("/forgot-password")
def forgot_password(
    *,
    db: Session = Depends(deps.get_db),
    email: str,
    background_tasks: BackgroundTasks
) -> Any:
    """
    Send password reset email
    """
    token = auth_service.create_password_reset_token(db, email=email)
    if token:
        # Send reset email in background
        background_tasks.add_task(
            notification_service.send_email,
            db,
            recipient_id=None,  # Will look up by email
            subject="Password Reset Request",
            body=f"Click here to reset your password: {settings.FRONTEND_URL}/reset-password?token={token}",
            template_type="password_reset"
        )
    
    # Always return success for security
    return {"message": "If the email exists, a reset link has been sent"}


@router.post("/reset-password")
def reset_password(
    *,
    db: Session = Depends(deps.get_db),
    token: str,
    new_password: str
) -> Any:
    """
    Reset password using token
    """
    user = auth_service.reset_password(db, token=token, new_password=new_password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    return {"message": "Password successfully reset"}


@router.post("/change-password")
def change_password(
    *,
    db: Session = Depends(deps.get_db),
    current_password: str,
    new_password: str,
    current_user: deps.CurrentUser = Depends(deps.get_current_active_user)
) -> Any:
    """
    Change password for logged in user
    """
    success = auth_service.change_password(
        db,
        user_id=current_user.id,
        current_password=current_password,
        new_password=new_password
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect password"
        )
    
    return {"message": "Password successfully changed"}


@router.post("/verify-email/{token}")
def verify_email(
    *,
    db: Session = Depends(deps.get_db),
    token: str
) -> Any:
    """
    Verify email address
    """
    user = auth_service.verify_email_token(db, token=token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token"
        )
    
    return {"message": "Email successfully verified"}