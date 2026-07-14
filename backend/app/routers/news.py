from fastapi import APIRouter, Depends, HTTPException, Form, File, UploadFile, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import json
from app.core.database import get_db
from app.core.security import RoleChecker, get_current_user
from app.schemas import NewsDetailOut, NewsOut, NewsCreate, NewsUpdate
from app.services import NewsService, MediaService
from app.models import User, News, Media, Category

router = APIRouter(prefix="/news", tags=["News"])

@router.get("", response_model=dict)
def list_articles(
    category_id: Optional[int] = None,
    level: Optional[str] = None,
    district: Optional[str] = None,
    language: Optional[str] = None,
    status_filter: str = "published",
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    articles, total = NewsService.list_news(
        db, category_id=category_id, level=level, district=district,
        language=language, status_filter=status_filter, search=search,
        skip=skip, limit=limit
    )
    # Serialize to DetailOut so client has category, author and media references
    from app.schemas import NewsDetailOut
    detail_articles = [NewsDetailOut.model_validate(art) for art in articles]
    return {
        "articles": detail_articles,
        "total": total,
        "skip": skip,
        "limit": limit
    }

@router.get("/videos", response_model=dict)
def list_video_articles(
    category_id: Optional[int] = None,
    language: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    # Filter only news articles that contain media_type == 'youtube'
    query = db.query(News).join(Media).filter(
        Media.media_type == "youtube",
        News.status == "published"
    )
    
    if category_id:
        query = query.filter(News.category_id == category_id)
    if language:
        query = query.filter(News.language == language)
        
    total = query.count()
    articles = query.order_by(News.published_at.desc()).offset(skip).limit(limit).all()
    
    from app.schemas import NewsDetailOut
    detail_articles = [NewsDetailOut.model_validate(art) for art in articles]
    return {
        "articles": detail_articles,
        "total": total,
        "skip": skip,
        "limit": limit
    }

@router.get("/{slug_or_id}", response_model=NewsDetailOut)
def get_article_details(slug_or_id: str, db: Session = Depends(get_db)):
    return NewsService.get_news_article(db, slug_or_id, increment_views=True)

@router.post("/create", response_model=NewsDetailOut)
def create_news(
    title: str = Form(...),
    content: str = Form(...),
    category_id: int = Form(...),
    language: str = Form("en"),
    status: str = Form("draft"),
    published_at: Optional[str] = Form(None), # format: ISO string
    youtube_urls: Optional[str] = Form(None), # comma-separated list of youtube URLs
    images: Optional[List[UploadFile]] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["admin", "reporter"]))
):
    # If reporter, verify they are approved before posting news
    if current_user.role.name == "reporter":
        if not current_user.reporter_profile or not current_user.reporter_profile.is_approved:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Reporter profile is not approved by administrator yet."
            )

    # Save images
    saved_images = []
    if images:
        for img in images:
            # Check empty file name
            if img.filename:
                path = MediaService.save_image_upload(img)
                saved_images.append(path)

    # Decode youtube list
    yt_list = []
    if youtube_urls:
        yt_list = [url.strip() for url in youtube_urls.split(",") if url.strip()]

    # Parse published_at
    parsed_pub_date = None
    if published_at:
        try:
            parsed_pub_date = datetime.fromisoformat(published_at.replace("Z", "+00:00"))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid publish date format. Use ISO format.")

    news_in = NewsCreate(
        title=title,
        content=content,
        category_id=category_id,
        language=language,
        status=status,
        published_at=parsed_pub_date,
        media_urls=yt_list
    )

    return NewsService.create_news(db, news_in, author_id=current_user.id, image_paths=saved_images)

@router.put("/{id}", response_model=NewsDetailOut)
def update_news(
    id: int,
    news_in: NewsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["admin", "reporter"]))
):
    db_news = db.query(News).filter(News.id == id).first()
    if not db_news:
        raise HTTPException(status_code=404, detail="News article not found")
        
    # Reporters can only edit their own news articles
    if current_user.role.name == "reporter" and db_news.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="You do not have permission to update other authors' articles.")
        
    return NewsService.update_news(db, id, news_in)

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_news(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["admin", "reporter"]))
):
    db_news = db.query(News).filter(News.id == id).first()
    if not db_news:
        raise HTTPException(status_code=404, detail="News article not found")
        
    # Reporters can only delete their own news articles
    if current_user.role.name == "reporter" and db_news.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="You do not have permission to delete other authors' articles.")
        
    db.delete(db_news)
    db.commit()
    return None
