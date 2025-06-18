from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional
import os
from dotenv import load_dotenv

# Load .env file
load_dotenv()

class Settings(BaseSettings):
    # Database - SQL
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "postgresql://postgres:123@localhost/recruitment_plus"
    )
    
    # Database - MongoDB
    MONGODB_HOST: str = os.getenv("MONGODB_HOST", "localhost")
    MONGODB_PORT: int = int(os.getenv("MONGODB_PORT", "27017"))
    MONGODB_USER: Optional[str] = os.getenv("MONGODB_USER")
    MONGODB_PASSWORD: Optional[str] = os.getenv("MONGODB_PASSWORD")
    MONGODB_DATABASE: str = os.getenv("MONGODB_DATABASE", "recruitment_plus")
    MONGODB_AUTH_SOURCE: str = os.getenv("MONGODB_AUTH_SOURCE", "admin")
    
    # Construct MongoDB URI based on authentication requirements
    @property
    def MONGODB_URI(self) -> str:
        """Constructs MongoDB connection string based on config."""
        if self.MONGODB_USER and self.MONGODB_PASSWORD:
            return f"mongodb://{self.MONGODB_USER}:{self.MONGODB_PASSWORD}@{self.MONGODB_HOST}:{self.MONGODB_PORT}/{self.MONGODB_DATABASE}?authSource={self.MONGODB_AUTH_SOURCE}"
        return f"mongodb://{self.MONGODB_HOST}:{self.MONGODB_PORT}/{self.MONGODB_DATABASE}"
    
    # MongoDB Connection Pooling
    MONGODB_MAX_CONNECTIONS: int = int(os.getenv("MONGODB_MAX_CONNECTIONS", "100"))
    MONGODB_MIN_CONNECTIONS: int = int(os.getenv("MONGODB_MIN_CONNECTIONS", "10"))
    MONGODB_MAX_IDLE_TIME_MS: int = int(os.getenv("MONGODB_MAX_IDLE_TIME_MS", "30000"))
    
    # MongoDB Timeouts
    MONGODB_SERVER_SELECTION_TIMEOUT: int = int(os.getenv("MONGODB_SERVER_SELECTION_TIMEOUT", "5000"))
    MONGODB_CONNECT_TIMEOUT: int = int(os.getenv("MONGODB_CONNECT_TIMEOUT", "10000"))
    MONGODB_SOCKET_TIMEOUT: int = int(os.getenv("MONGODB_SOCKET_TIMEOUT", "20000"))
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-here")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))
    
    # First superuser
    FIRST_SUPERUSER_EMAIL: str = os.getenv("FIRST_SUPERUSER_EMAIL", "admin@example.com")
    FIRST_SUPERUSER_PASSWORD: str = os.getenv("FIRST_SUPERUSER_PASSWORD", "changethis")
    
    # Environment
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"
    
    # Email
    SMTP_HOST: Optional[str] = os.getenv("SMTP_HOST")
    SMTP_PORT: Optional[int] = int(os.getenv("SMTP_PORT", "587")) if os.getenv("SMTP_PORT") else None
    
    # OpenAI API settings
    OPENAI_API_KEY: Optional[str] = None
    
    # SMTP settings
    SMTP_SERVER: Optional[str] = None
    SMTP_USERNAME: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    EMAIL_FROM: Optional[str] = None
    
    # Frontend URL (for CORS and links in emails)
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    
    # Use model_config instead of Config class in Pydantic v2
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore"  # This will ignore any extra fields in the environment
    )

settings = Settings()