from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.security import get_current_user
from app.schemas import NotificationOut
from app.services import NotificationService
from app.models import User

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("", response_model=List[NotificationOut])
def get_my_notifications(
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    return NotificationService.list_notifications(db, current_user.id)

@router.post("/read-all", status_code=status.HTTP_200_OK)
def mark_notifications_read(
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    NotificationService.mark_all_as_read(db, current_user.id)
    return {"message": "All notifications marked as read."}
