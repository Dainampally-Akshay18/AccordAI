import os
from typing import Optional
from pydantic_settings import BaseSettings
from pydantic import Field
from urllib.parse import quote_plus

class Settings(BaseSettings):
    # API Configuration
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Legal AI Platform"
    VERSION: str = "1.0.0"
    
    # Environment
    ENVIRONMENT: str = Field(default="development", env="ENVIRONMENT")
    DEBUG: bool = Field(default=True, env="DEBUG")
    
    # Database Components
    DB_USER: str = Field(default="postgres", env="DB_USER")
    DB_PASSWORD: str = Field(..., env="DB_PASSWORD")
    DB_HOST: str = Field(..., env="DB_HOST")
    DB_PORT: int = Field(default=5432, env="DB_PORT")
    DB_NAME: str = Field(default="postgres", env="DB_NAME")
    
    # Allow DATABASE_URL but don't use it directly
    DATABASE_URL_RAW: Optional[str] = Field(default=None, env="DATABASE_URL")
    
    @property
    def DATABASE_URL(self) -> str:
        """Construct database URL with properly encoded credentials"""
        # If we have all components, build the URL
        if all([self.DB_USER, self.DB_PASSWORD, self.DB_HOST, self.DB_PORT, self.DB_NAME]):
            # Properly encode the password
            encoded_password = quote_plus(self.DB_PASSWORD)
            # Correct format: postgresql+asyncpg://user:password@host:port/database
            return f"postgresql+asyncpg://{self.DB_USER}:{encoded_password}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
        # Fall back to raw URL if components aren't available
        elif self.DATABASE_URL_RAW:
            return self.DATABASE_URL_RAW
        else:
            raise ValueError("Database configuration is incomplete")
    
    # Firebase
    # FIREBASE_CREDENTIALS_PATH: Optional[str] = Field(default=None, env="FIREBASE_CREDENTIALS_PATH")
    # FIREBASE_PROJECT_ID: str = Field(..., env="FIREBASE_PROJECT_ID")
    
    # AI Services
    GROQ_API_KEY: str = Field(..., env="GROQ_API_KEY")
    PINECONE_API_KEY: str = Field(..., env="PINECONE_API_KEY")
    PINECONE_ENVIRONMENT: str = Field(..., env="PINECONE_ENVIRONMENT")
    PINECONE_INDEX_NAME: str = Field(default="legal-clauses", env="PINECONE_INDEX_NAME")
    
    # Redis
    REDIS_URL: str = Field(default="redis://localhost:6379", env="REDIS_URL")
    
    # File Storage
    SUPABASE_URL: str = Field(..., env="SUPABASE_URL")
    SUPABASE_KEY: str = Field(..., env="SUPABASE_KEY")
    MAX_FILE_SIZE: int = Field(default=10 * 1024 * 1024, env="MAX_FILE_SIZE")  # 10MB
    
    # Security
    SECRET_KEY: str = Field(..., env="SECRET_KEY")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30, env="ACCESS_TOKEN_EXPIRE_MINUTES")
    
    # CORS
    ALLOWED_ORIGINS: list = Field(
        default=["http://localhost:3000", "https://your-frontend.netlify.app"],
        env="ALLOWED_ORIGINS"
    )
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "allow"  # Changed to "allow" to accept extra fields

settings = Settings()