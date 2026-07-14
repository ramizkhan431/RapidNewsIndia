from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

# Audit columns mixin
class AuditMixin:
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, index=True, nullable=False)  # 'admin', 'reporter', 'user'
    description = Column(String(255), nullable=True)

    users = relationship("User", back_populates="role")

class User(Base, AuditMixin):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(150), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    role = relationship("Role", back_populates="users")
    reporter_profile = relationship("Reporter", back_populates="user", uselist=False)
    news_articles = relationship("News", back_populates="author")
    notifications = relationship("Notification", back_populates="user")
    moderated_submissions = relationship("Submission", back_populates="moderator")

class Reporter(Base, AuditMixin):
    __tablename__ = "reporters"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    district = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    bio = Column(Text, nullable=True)
    is_approved = Column(Boolean, default=False, nullable=False)

    user = relationship("User", back_populates="reporter_profile")

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    slug = Column(String(100), unique=True, index=True, nullable=False)
    level = Column(String(50), nullable=False)  # 'national', 'state', 'district'
    parent_id = Column(Integer, ForeignKey("categories.id"), nullable=True)

    parent = relationship("Category", remote_side=[id], back_populates="children")
    children = relationship("Category", back_populates="parent", cascade="all, delete-orphan")
    news_articles = relationship("News", back_populates="category")

class News(Base, AuditMixin):
    __tablename__ = "news"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, index=True, nullable=False)
    content = Column(Text, nullable=False)
    language = Column(String(10), default="en", nullable=False)  # 'en', 'hi', 'bn'
    status = Column(String(50), default="draft", nullable=False)  # 'draft', 'published', 'scheduled'
    published_at = Column(DateTime(timezone=True), nullable=True)
    view_count = Column(Integer, default=0, nullable=False)
    
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)

    author = relationship("User", back_populates="news_articles")
    category = relationship("Category", back_populates="news_articles")
    media_items = relationship("Media", back_populates="news", cascade="all, delete-orphan")

class Media(Base):
    __tablename__ = "media"

    id = Column(Integer, primary_key=True, index=True)
    media_type = Column(String(50), nullable=False)  # 'image', 'youtube'
    url = Column(String(500), nullable=False)  # local file path or youtube URL
    title = Column(String(255), nullable=True)
    
    news_id = Column(Integer, ForeignKey("news.id"), nullable=True)
    submission_id = Column(Integer, ForeignKey("submissions.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    news = relationship("News", back_populates="media_items")
    submission = relationship("Submission", back_populates="media_items")

class Submission(Base, AuditMixin):
    __tablename__ = "submissions"

    id = Column(Integer, primary_key=True, index=True)
    submission_type = Column(String(50), nullable=False)  # 'tip', 'complaint', 'opinion'
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    reporter_name = Column(String(100), nullable=True)  # Name of user submitting
    reporter_email = Column(String(150), nullable=False)
    district = Column(String(100), nullable=True)
    status = Column(String(50), default="pending", nullable=False)  # 'pending', 'approved', 'rejected'
    
    moderated_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    moderation_notes = Column(Text, nullable=True)

    moderator = relationship("User", back_populates="moderated_submissions")
    media_items = relationship("Media", back_populates="submission", cascade="all, delete-orphan")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user = relationship("User", back_populates="notifications")
