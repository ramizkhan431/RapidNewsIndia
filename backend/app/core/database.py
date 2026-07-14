import logging
from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

logger = logging.getLogger(__name__)

def _build_engine():
    db_url = settings.DATABASE_URL
    connect_args = {}
    engine_kwargs = {"pool_pre_ping": True}

    if db_url.startswith("sqlite"):
        connect_args = {"check_same_thread": False}
    elif db_url.startswith("postgresql"):
        connect_args = {"sslmode": "require"}
    else:
        logger.warning("Invalid database URL scheme. Defaulting to local SQLite database.")
        db_url = "sqlite:///./rapid_news.db"
        connect_args = {"check_same_thread": False}

    engine = create_engine(db_url, connect_args=connect_args, **engine_kwargs)

    if db_url.startswith("postgresql"):
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return engine

    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return engine
    except Exception as exc:
        logger.warning(f"Database connection failed for {db_url}: {exc}. Falling back to SQLite.")
        fallback_db_url = "sqlite:///./rapid_news.db"
        return create_engine(fallback_db_url, connect_args={"check_same_thread": False}, **engine_kwargs)


engine = _build_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
