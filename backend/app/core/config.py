"""
Configuration management for the backend API.
"""

from functools import lru_cache
from typing import Literal, Union, Optional
from pydantic import Field, field_validator, AnyHttpUrl, PostgresDsn
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Environment
    environment: Literal["development", "staging", "production"] = Field(
        default="development", description="Application environment"
    )

    # API Keys
    openweather_api_key: str = Field(..., description="OpenWeatherMap API key")
    openai_api_key: str = Field(default="", description="OpenAI API key")

    # Security / Auth
    secret_key: str = Field(..., description="Secret key for JWT")
    algorithm: str = Field(default="HS256", description="JWT algorithm")
    access_token_expire_minutes: int = Field(default=30, description="Access token expiry")
    refresh_token_expire_days: int = Field(default=7, description="Refresh token expiry")
    auth_provider: Literal["local", "supabase"] = Field(
        default="local",
        description="Authentication provider: local JWT or Supabase",
    )

    # Supabase
    supabase_url: Optional[AnyHttpUrl] = Field(
        default=None,
        description="Supabase project URL",
    )
    supabase_key: Optional[str] = Field(
        default=None,
        description="Supabase anon or service role key",
    )

    # Database
    database_url: Union[str, PostgresDsn] = Field(
        default="postgresql+psycopg2://postgres:postgres@db:5432/moometrics",
        description="Database connection string"
    )
    postgres_host: str = Field(default="db", description="Postgres host")
    postgres_port: int = Field(default=5432, description="Postgres port")
    postgres_db: str = Field(default="moometrics", description="Postgres database name")
    postgres_user: str = Field(default="postgres", description="Postgres user")
    postgres_password: str = Field(default="postgres", description="Postgres password")

    # Redis Cache settings
    redis_url: str = Field(default="redis://redis:6379/0", description="Redis connection URL")
    cache_ttl_seconds: int = Field(
        default=300, description="Cache TTL in seconds (5 minutes default)"
    )

    # Logging
    log_level: str = Field(default="INFO", description="Logging level")

    @field_validator("openweather_api_key")
    @classmethod
    def validate_weather_api_key(cls, v: str) -> str:
        """Validate OpenWeatherMap API key format."""
        if len(v) < 10:
            raise ValueError("OpenWeatherMap API key seems invalid (too short)")
        return v

    @field_validator("log_level")
    @classmethod
    def validate_log_level(cls, v: str) -> str:
        """Validate log level."""
        valid_levels = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
        if v.upper() not in valid_levels:
            raise ValueError(f"Invalid log level. Must be one of: {valid_levels}")
        return v.upper()

    @property
    def is_production(self) -> bool:
        """Check if running in production environment."""
        return self.environment == "production"

    @property
    def is_development(self) -> bool:
        """Check if running in development environment."""
        return self.environment == "development"

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """
    Get settings instance (singleton pattern using lru_cache).
    Settings are loaded once and cached for the application lifetime.
    """
    return Settings()
