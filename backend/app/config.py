"""
Application Configuration
Using Pydantic Settings for environment variables
"""

from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # Application
    APP_NAME: str = "InternAudit AI"
    APP_ENV: str = "development"
    DEBUG: bool = True
    SECRET_KEY: str = "change-me-in-production"

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/intern_audit"
    DATABASE_SYNC_URL: str = "postgresql://postgres:postgres@localhost:5432/intern_audit"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Anthropic Claude API (or Zhipu AI compatible)
    ANTHROPIC_API_KEY: Optional[str] = None
    ANTHROPIC_BASE_URL: Optional[str] = None

    # Google/Gmail API
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/api/auth/google/callback"
    GOOGLE_REFRESH_TOKEN: Optional[str] = None

    # JWT Settings
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_MINUTES: int = 60

    # File Storage
    UPLOAD_DIR: str = "./uploads"
    SCREENSHOTS_DIR: str = "./screenshots"
    REPOS_DIR: str = "./repos"

    # Task PDF
    TASK_PDF_PATH: Optional[str] = None

    # GitHub API
    GITHUB_TOKEN: Optional[str] = None

    # CORS
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:3000"

    # Logging
    LOG_LEVEL: str = "INFO"

    @property
    def is_development(self) -> bool:
        return self.APP_ENV == "development"

    @property
    def is_production(self) -> bool:
        return self.APP_ENV == "production"


# Global settings instance
settings = Settings()
