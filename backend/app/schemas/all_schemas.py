from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator
import re

# ----------------- Auth & Token Schemas -----------------
class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    full_name: str
    user_id: int

class TokenPayload(BaseModel):
    sub: Optional[str] = None

class LoginRequest(BaseModel):
    username: EmailStr
    password: str

# ----------------- Role Schemas -----------------
class RoleOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)

# ----------------- User Schemas -----------------
class UserBase(BaseModel):
    email: EmailStr
    full_name: str

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None

class UserOut(UserBase):
    id: int
    role_id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class UserWithRole(UserOut):
    role: RoleOut
    reporter_profile: Optional["ReporterOut"] = None

    model_config = ConfigDict(from_attributes=True)

# ----------------- Reporter Schemas -----------------
class ReporterBase(BaseModel):
    district: str
    state: str
    bio: Optional[str] = None

class ReporterCreate(ReporterBase):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str

class ReporterUpdate(BaseModel):
    district: Optional[str] = None
    state: Optional[str] = None
    bio: Optional[str] = None
    is_approved: Optional[bool] = None

class ReporterOut(ReporterBase):
    id: int
    user_id: int
    is_approved: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ReporterWithUser(ReporterOut):
    user: UserOut

    model_config = ConfigDict(from_attributes=True)

# ----------------- Category Schemas -----------------
class CategoryBase(BaseModel):
    name: str
    slug: str
    level: str  # 'national', 'state', 'district'
    parent_id: Optional[int] = None

class CategoryCreate(CategoryBase):
    pass

class CategoryOut(CategoryBase):
    id: int
    
    model_config = ConfigDict(from_attributes=True)

class CategoryTreeOut(CategoryOut):
    children: List["CategoryTreeOut"] = []

    model_config = ConfigDict(from_attributes=True)

# ----------------- Media Schemas -----------------
class MediaBase(BaseModel):
    media_type: str  # 'image', 'youtube'
    url: str
    title: Optional[str] = None

class MediaCreate(MediaBase):
    pass

class MediaOut(MediaBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# ----------------- News Schemas -----------------
class NewsBase(BaseModel):
    title: str
    content: str
    language: str = "en"  # 'en', 'hi', 'bn'
    status: str = "draft"  # 'draft', 'published', 'scheduled'
    published_at: Optional[datetime] = None
    category_id: int

class NewsCreate(NewsBase):
    media_urls: Optional[List[str]] = None  # YouTube URLs
    # Image files will be uploaded separately via multipart request

class NewsUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    language: Optional[str] = None
    status: Optional[str] = None
    published_at: Optional[datetime] = None
    category_id: Optional[int] = None
    media_urls: Optional[List[str]] = None

class NewsOut(NewsBase):
    id: int
    slug: str
    view_count: int
    author_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class NewsDetailOut(NewsOut):
    author: UserOut
    category: CategoryOut
    media_items: List[MediaOut] = []

    model_config = ConfigDict(from_attributes=True)

# ----------------- Submission Schemas -----------------
class SubmissionBase(BaseModel):
    submission_type: str  # 'tip', 'complaint', 'opinion'
    title: str
    content: str
    reporter_name: Optional[str] = None
    reporter_email: EmailStr
    district: Optional[str] = None

class SubmissionCreate(SubmissionBase):
    youtube_url: Optional[str] = None

    @field_validator("youtube_url")
    def validate_youtube_url(cls, v):
        if not v:
            return v
        youtube_regex = r"^(https?://)?(www\.)?(youtube\.com|youtu\.be)/(watch\?v=|embed/|v/|shorts/)?([a-zA-Z0-9_-]{11})"
        if not re.match(youtube_regex, v):
            raise ValueError("Invalid YouTube URL. Must be a valid youtube.com or youtu.be link.")
        return v

class SubmissionUpdate(BaseModel):
    status: Optional[str] = None  # 'pending', 'approved', 'rejected'
    moderation_notes: Optional[str] = None

class SubmissionOut(SubmissionBase):
    id: int
    status: str
    moderated_by: Optional[int] = None
    moderation_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    media_items: List[MediaOut] = []

    model_config = ConfigDict(from_attributes=True)

# ----------------- Notification Schemas -----------------
class NotificationBase(BaseModel):
    title: str
    message: str

class NotificationOut(NotificationBase):
    id: int
    user_id: int
    is_read: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# ----------------- Dashboard Schemas -----------------
class DashboardStats(BaseModel):
    users_count: int
    reporters_count: int
    news_count: int
    submissions_count: int
    views_count: int

# Resolve forward references
UserWithRole.model_rebuild()
