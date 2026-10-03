from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    APP_NAME: str = "Money Machine 24H"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    HOST: str = "0.0.0.0"
    PORT: int = 8000

    DATABASE_URL: str = "sqlite:///./money_machine.db"

    CORS_ORIGINS: list[str] = ["*"]
    CORS_ALLOW_CREDENTIALS: bool = True
    CORS_ALLOW_METHODS: list[str] = ["*"]
    CORS_ALLOW_HEADERS: list[str] = ["*"]

    SECRET_KEY: str = "change-me-in-production"

    SCHEDULER_MAX_INSTANCES: int = 5
    SCHEDULER_COALESCING: bool = False
    SCHEDULER_MISFIRE_GRACE_TIME: int = 60

    RATE_LIMIT_DEFAULT: str = "100/minute"

    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"

    BASE_DIR: Path = Field(default_factory=lambda: Path(__file__).resolve().parent.parent)


@lru_cache
def get_settings() -> Settings:
    return Settings()
