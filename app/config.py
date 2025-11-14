from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Firebase Configuration
    FIREBASE_PROJECT_ID: str = ""
    FIREBASE_API_KEY: str = ""
    FIREBASE_SERVICE_ACCOUNT_FILE: Optional[str] = None
    FIREBASE_SERVICE_ACCOUNT_JSON: Optional[str] = None

    # FatSecret API Configuration
    FATSECRET_KEY: str = ""
    FATSECRET_SECRET: str = ""

    # Google Gemini AI Configuration
    GEMINI_KEY: str = ""

    # Server Configuration
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # Environment
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"

# Create settings instance
settings = Settings()
