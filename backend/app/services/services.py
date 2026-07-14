import os
import re
import uuid
from datetime import datetime
from typing import List, Optional, Tuple
from fastapi import UploadFile, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc, func
from app.core.config import settings
from app.core.security import get_password_hash
from app.models import User, Role, Reporter, Category, News, Media, Submission, Notification
from app.schemas import (
    UserCreate, ReporterCreate, NewsCreate, NewsUpdate, 
    SubmissionCreate, SubmissionUpdate, CategoryCreate
)

# ----------------- Slug Generator -----------------
def generate_slug(title: str) -> str:
    # Lowercase the title
    slug = title.lower().strip()
    # Replace spaces and underscores with a single dash
    slug = re.sub(r'[\s\_]+', '-', slug)
    # Remove symbols but KEEP Unicode letters (supports Hindi and Bengali character sets)
    slug = re.sub(r'[^\w\s-]', '', slug)
    slug = re.sub(r'[-\s]+', '-', slug)
    slug = slug.strip('-')
    # Add a short unique suffix to avoid duplicates
    unique_suffix = uuid.uuid4().hex[:6]
    return f"{slug}-{unique_suffix}"

# ----------------- YouTube Link Processor -----------------
def convert_to_embed_url(youtube_url: str) -> str:
    if not youtube_url:
        return ""
    # Extract 11-character video ID
    regex = r"(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^\"&?\/\s]{11})"
    match = re.search(regex, youtube_url)
    if match:
        video_id = match.group(1)
        return f"https://www.youtube.com/embed/{video_id}"
    return youtube_url

# ----------------- Role Init Service -----------------
def init_roles_and_admin(db: Session):
    # Setup roles if they do not exist
    roles = ['admin', 'reporter', 'user']
    role_objs = {}
    for r_name in roles:
        role = db.query(Role).filter(Role.name == r_name).first()
        if not role:
            role = Role(name=r_name, description=f"Default {r_name} role")
            db.add(role)
            db.commit()
            db.refresh(role)
        role_objs[r_name] = role

    # Check if admin user exists
    admin_user = db.query(User).filter(User.email == "admin@rapidnewsindia.com").first()
    if not admin_user:
        admin_user = User(
            email="admin@rapidnewsindia.com",
            hashed_password=get_password_hash("adminpassword123"),
            full_name="System Admin",
            role_id=role_objs['admin'].id,
            is_active=True
        )
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
    
    # Check if a few categories exist (National, State, District)
    if db.query(Category).count() == 0:
        national = Category(name="National", slug="national", level="national")
        state = Category(name="State", slug="state", level="state")
        district = Category(name="District", slug="district", level="district")
        db.add_all([national, state, district])
        db.commit()

# ----------------- Auth & User Service -----------------
class UserService:
    @staticmethod
    def create_user(db: Session, user_in: UserCreate, role_name: str = "user") -> User:
        # Check email
        existing = db.query(User).filter(User.email == user_in.email).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        role = db.query(Role).filter(Role.name == role_name).first()
        if not role:
            raise HTTPException(status_code=500, detail=f"Role '{role_name}' not initialized")

        db_user = User(
            email=user_in.email,
            hashed_password=get_password_hash(user_in.password),
            full_name=user_in.full_name,
            role_id=role.id,
            is_active=True
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user

    @staticmethod
    def create_reporter(db: Session, rep_in: ReporterCreate) -> Reporter:
        # Check email
        existing = db.query(User).filter(User.email == rep_in.email).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        role = db.query(Role).filter(Role.name == "reporter").first()
        if not role:
            raise HTTPException(status_code=500, detail="Reporter role not initialized")
        
        # Create User
        db_user = User(
            email=rep_in.email,
            hashed_password=get_password_hash(rep_in.password),
            full_name=rep_in.full_name,
            role_id=role.id,
            is_active=True
        )
        db.add(db_user)
        db.flush()  # get user.id

        # Create Reporter profile
        db_reporter = Reporter(
            user_id=db_user.id,
            district=rep_in.district,
            state=rep_in.state,
            bio=rep_in.bio,
            is_approved=False  # requires admin approval
        )
        db.add(db_reporter)
        db.commit()
        db.refresh(db_reporter)
        
        # Create notification for admin
        admin_role = db.query(Role).filter(Role.name == "admin").first()
        admin_users = db.query(User).filter(User.role_id == admin_role.id).all()
        for admin in admin_users:
            NotificationService.create_notification(
                db, admin.id, "New Reporter Signup", 
                f"Reporter {rep_in.full_name} has requested verification for district {rep_in.district}."
            )
        return db_reporter

# ----------------- Media Storage Service -----------------
class MediaService:
    ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp"}
    MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

    @staticmethod
    def save_image_upload(file: UploadFile) -> str:
        # Validate extension
        _, ext = os.path.splitext(file.filename.lower())
        if ext not in MediaService.ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid file format. Allowed: {list(MediaService.ALLOWED_EXTENSIONS)}"
            )

        # Ensure upload dir exists
        upload_dir = settings.UPLOAD_DIR
        os.makedirs(upload_dir, exist_ok=True)

        # Generate a unique name
        filename = f"{uuid.uuid4().hex}{ext}"
        filepath = os.path.join(upload_dir, filename)

        # Check size and write
        size = 0
        with open(filepath, "wb") as buffer:
            while chunk := file.file.read(8192):
                size += len(chunk)
                if size > MediaService.MAX_FILE_SIZE:
                    # Clean up file
                    buffer.close()
                    os.remove(filepath)
                    raise HTTPException(status_code=400, detail="File too large. Maximum size is 5MB.")
                buffer.write(chunk)
        
        # Return path that can be served statically (e.g. /static/uploads/filename)
        return f"/static/uploads/{filename}"

# ----------------- Category Service -----------------
class CategoryService:
    @staticmethod
    def create_category(db: Session, cat_in: CategoryCreate) -> Category:
        existing = db.query(Category).filter(Category.slug == cat_in.slug).first()
        if existing:
            raise HTTPException(status_code=400, detail="Category slug already exists")
        db_cat = Category(**cat_in.model_dump())
        db.add(db_cat)
        db.commit()
        db.refresh(db_cat)
        return db_cat

    @staticmethod
    def get_categories_tree(db: Session) -> List[Category]:
        # Return categories structured hierarchically
        all_cats = db.query(Category).all()
        # Find root categories (parent_id is None)
        roots = [c for c in all_cats if c.parent_id is None]
        return roots

# ----------------- News Service -----------------
class NewsService:
    @staticmethod
    def create_news(db: Session, news_in: NewsCreate, author_id: int, image_paths: List[str] = None) -> News:
        slug = generate_slug(news_in.title)
        
        db_news = News(
            title=news_in.title,
            slug=slug,
            content=news_in.content,
            language=news_in.language,
            status=news_in.status,
            published_at=news_in.published_at if news_in.status == "scheduled" else (datetime.utcnow() if news_in.status == "published" else None),
            author_id=author_id,
            category_id=news_in.category_id
        )
        db.add(db_news)
        db.flush()  # get news.id

        # Save Youtube urls
        if news_in.media_urls:
            for y_url in news_in.media_urls:
                embed_url = convert_to_embed_url(y_url)
                media = Media(
                    media_type="youtube",
                    url=embed_url,
                    title="YouTube Video",
                    news_id=db_news.id
                )
                db.add(media)
        
        # Save uploaded image paths
        if image_paths:
            for idx, img_path in enumerate(image_paths):
                media = Media(
                    media_type="image",
                    url=img_path,
                    title=f"Featured Image {idx + 1}",
                    news_id=db_news.id
                )
                db.add(media)

        db.commit()
        db.refresh(db_news)
        return db_news

    @staticmethod
    def update_news(db: Session, news_id: int, news_in: NewsUpdate) -> News:
        db_news = db.query(News).filter(News.id == news_id).first()
        if not db_news:
            raise HTTPException(status_code=404, detail="News article not found")
        
        update_data = news_in.model_dump(exclude_unset=True)
        media_urls = update_data.pop("media_urls", None)

        for field, value in update_data.items():
            setattr(db_news, field, value)

        if news_in.status == "published" and not db_news.published_at:
            db_news.published_at = datetime.utcnow()
        elif news_in.status == "scheduled" and news_in.published_at:
            db_news.published_at = news_in.published_at

        # Update YouTube links if provided
        if media_urls is not None:
            # Delete old youtube links
            db.query(Media).filter(Media.news_id == news_id, Media.media_type == "youtube").delete()
            for y_url in media_urls:
                embed_url = convert_to_embed_url(y_url)
                media = Media(
                    media_type="youtube",
                    url=embed_url,
                    title="YouTube Video",
                    news_id=news_id
                )
                db.add(media)

        db.commit()
        db.refresh(db_news)
        return db_news

    @staticmethod
    def get_news_article(db: Session, slug_or_id: str, increment_views: bool = False) -> News:
        # Check if id
        if slug_or_id.isdigit():
            db_news = db.query(News).filter(News.id == int(slug_or_id)).first()
        else:
            db_news = db.query(News).filter(News.slug == slug_or_id).first()

        if not db_news:
            raise HTTPException(status_code=404, detail="News article not found")
        
        # If scheduled but not yet published, block standard viewing unless it's draft review
        if db_news.status == "scheduled" and db_news.published_at > datetime.utcnow():
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This article is scheduled to publish in the future.")

        if increment_views:
            db_news.view_count += 1
            db.commit()
            db.refresh(db_news)
            
        return db_news

    @staticmethod
    def list_news(
        db: Session, 
        category_id: Optional[int] = None, 
        level: Optional[str] = None, 
        district: Optional[str] = None,
        language: Optional[str] = None, 
        status_filter: str = "published", 
        search: Optional[str] = None,
        skip: int = 0, 
        limit: int = 20
    ) -> Tuple[List[News], int]:
        query = db.query(News)

        # Filters for Published status (handles scheduled articles whose time has passed)
        now = datetime.utcnow()
        if status_filter == "published":
            query = query.filter(
                or_(
                    News.status == "published",
                    and_(News.status == "scheduled", News.published_at <= now)
                )
            )
        elif status_filter == "draft":
            query = query.filter(News.status == "draft")
        elif status_filter == "scheduled":
            query = query.filter(News.status == "scheduled")

        # Category mapping
        if category_id:
            # We want to match category or its descendants
            cats = db.query(Category).all()
            category_ids = {category_id}
            # Single-tier check child categories
            for c in cats:
                if c.parent_id == category_id:
                    category_ids.add(c.id)
            query = query.filter(News.category_id.in_(category_ids))

        # Filter by Category Hierarchy Level
        if level:
            query = query.join(Category).filter(Category.level == level)

        # Search Query (Title + Content)
        if search:
            search_regex = f"%{search}%"
            query = query.filter(or_(News.title.ilike(search_regex), News.content.ilike(search_regex)))

        # Filter by Language
        if language:
            query = query.filter(News.language == language)

        total = query.count()
        articles = query.order_by(desc(News.published_at), desc(News.created_at)).offset(skip).limit(limit).all()
        return articles, total

# ----------------- Submission Service -----------------
class SubmissionService:
    @staticmethod
    def create_submission(db: Session, sub_in: SubmissionCreate, image_paths: List[str] = None) -> Submission:
        db_sub = Submission(
            submission_type=sub_in.submission_type,
            title=sub_in.title,
            content=sub_in.content,
            reporter_name=sub_in.reporter_name,
            reporter_email=sub_in.reporter_email,
            district=sub_in.district,
            status="pending"
        )
        db.add(db_sub)
        db.flush()  # get submission.id

        # Save Youtube link if provided
        if sub_in.youtube_url:
            embed_url = convert_to_embed_url(sub_in.youtube_url)
            media = Media(
                media_type="youtube",
                url=embed_url,
                title="YouTube Video Contribution",
                submission_id=db_sub.id
            )
            db.add(media)

        # Save uploaded image paths
        if image_paths:
            for idx, img_path in enumerate(image_paths):
                media = Media(
                    media_type="image",
                    url=img_path,
                    title=f"User Image {idx + 1}",
                    submission_id=db_sub.id
                )
                db.add(media)

        db.commit()
        db.refresh(db_sub)

        # Send notification to admin users
        admin_role = db.query(Role).filter(Role.name == "admin").first()
        admin_users = db.query(User).filter(User.role_id == admin_role.id).all()
        for admin in admin_users:
            NotificationService.create_notification(
                db, admin.id, "New Content Submission", 
                f"A new {sub_in.submission_type} submission titled '{sub_in.title}' requires your moderation."
            )

        return db_sub

    @staticmethod
    def moderate_submission(db: Session, sub_id: int, sub_up: SubmissionUpdate, moderator_id: int) -> Submission:
        db_sub = db.query(Submission).filter(Submission.id == sub_id).first()
        if not db_sub:
            raise HTTPException(status_code=404, detail="Submission not found")
        
        db_sub.status = sub_up.status
        db_sub.moderated_by = moderator_id
        db_sub.moderation_notes = sub_up.moderation_notes

        # If approved, convert to a draft News article
        if sub_up.status == "approved":
            # Search for a category to put this submission under. Fallback to state/national or create draft
            category = db.query(Category).first()
            category_id = category.id if category else 1

            # Build NewsCreate schema
            # Gather media items associated with the submission
            y_urls = [m.url for m in db_sub.media_items if m.media_type == "youtube"]
            img_paths = [m.url for m in db_sub.media_items if m.media_type == "image"]
            
            news_in = NewsCreate(
                title=db_sub.title,
                content=db_sub.content,
                language="en",
                status="draft",
                category_id=category_id,
                media_urls=y_urls
            )
            # Create the draft news
            NewsService.create_news(db, news_in, author_id=moderator_id, image_paths=img_paths)

        db.commit()
        db.refresh(db_sub)
        return db_sub

# ----------------- Notification Service -----------------
class NotificationService:
    @staticmethod
    def create_notification(db: Session, user_id: int, title: str, message: str) -> Notification:
        notif = Notification(
            user_id=user_id,
            title=title,
            message=message,
            is_read=False
        )
        db.add(notif)
        db.commit()
        db.refresh(notif)
        return notif

    @staticmethod
    def list_notifications(db: Session, user_id: int) -> List[Notification]:
        return db.query(Notification).filter(Notification.user_id == user_id).order_by(desc(Notification.created_at)).all()

    @staticmethod
    def mark_all_as_read(db: Session, user_id: int):
        db.query(Notification).filter(Notification.user_id == user_id, Notification.is_read == False).update({"is_read": True})
        db.commit()
