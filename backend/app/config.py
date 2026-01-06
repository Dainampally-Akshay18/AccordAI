import os
from typing import Optional
from pydantic_settings import BaseSettings
from pydantic import Field
from urllib.parse import quote_plus

class Settings(BaseSettings):
    # API Configuration
    SECRET_KEY: str = "your-super-secret-jwt-key-change-this-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Legal AI Platform"
    VERSION: str = "1.0.0"
    
    # Environment
    ENVIRONMENT: str = Field(default="development", env="ENVIRONMENT")
    DEBUG: bool = Field(default=True, env="DEBUG")
    
    
    
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
    #FIREBASE ADMIN SDK
    FIREBASE_PROJECT_ID: str = Field(..., env="PROJECT_ID")
   
    
    FIREBASE_PRIVATE_KEY: str = Field(..., env="FIREBASE_PRIVATE_KEY")
    print("Firebase PRivate Key:", FIREBASE_PRIVATE_KEY)
    FIREBASE_CLIENT_EMAIL: str = Field(..., env="FIREBASE_CLIENT_EMAIL")
    FIREBASE_CLIENT_ID: str = Field(..., env="FIREBASE_CLIENT_ID")
    FIREBASE_AUTH_URI: str = Field(..., env="FIREBASE_AUTH_URI")
    FIREBASE_TOKEN_URI: str = Field(..., env="FIREBASE_TOKEN_URI")
    FIREBASE_AUTH_PROVIDER_X509_CERT_URL: str = Field(..., env="FIREBASE_AUTH_PROVIDER_X509_CERT_URL")
    FIREBASE_CLIENT_X509_CERT_URL: str = Field(..., env="FIREBASE_CLIENT_X509_CERT_URL")
    FIREBASE_UNIVERSE_DOMAIN: str = Field(..., env="FIREBASE_UNIVERSE_DOMAIN")
    FIREBASE_PRIVATE_KEY_ID: str = Field(..., env="FIREBASE_PRIVATE_KEY_ID")
    FIREBASE_TYPE: str = Field(..., env="FIREBASE_TYPE")
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