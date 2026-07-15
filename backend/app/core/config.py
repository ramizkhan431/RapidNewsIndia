import os
from pydantic_settings import BaseSettings
from pydantic import ConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/rapid_news_db"
    SECRET_KEY: str = "supersecretjwtkeyforrapidnewsindia2026makeitsufficientlylong"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    UPLOAD_DIR: str = "static/uploads"
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    ADMIN_EMAIL: str = "admin@rapidnewsindia.com"
    ADMIN_PASSWORD: str = "adminpassword123"

    model_config = ConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
