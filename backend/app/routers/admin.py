from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from app.core.database import get_db
from app.core.security import RoleChecker
from app.schemas import DashboardStats, SubmissionOut, SubmissionUpdate, ReporterWithUser, UserOut
from app.services import SubmissionService, NotificationService
from app.models import User, Reporter, News, Submission, Role

router = APIRouter(prefix="/admin", tags=["Admin Panel"], dependencies=[Depends(RoleChecker(["admin"]))])

@router.get("/dashboard/stats", response_model=DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    users_count = db.query(User).count()
    reporters_count = db.query(Reporter).count()
    news_count = db.query(News).count()
    submissions_count = db.query(Submission).count()
    
    # Calculate sum of all news views
    views_result = db.query(func.sum(News.view_count)).scalar()
    views_count = int(views_result) if views_result else 0
    
    return {
        "users_count": users_count,
        "reporters_count": reporters_count,
        "news_count": news_count,
        "submissions_count": submissions_count,
        "views_count": views_count
    }

@router.get("/submissions", response_model=List[SubmissionOut])
def list_all_submissions(db: Session = Depends(get_db)):
    return db.query(Submission).order_by(Submission.created_at.desc()).all()

@router.post("/submissions/{id}/moderate", response_model=SubmissionOut)
def moderate_user_submission(
    id: int, 
    sub_up: SubmissionUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["admin"]))
):
    if sub_up.status not in ["approved", "rejected", "pending"]:
        raise HTTPException(status_code=400, detail="Invalid status. Must be approved or rejected.")
    
    return SubmissionService.moderate_submission(db, id, sub_up, moderator_id=current_user.id)

@router.get("/reporters", response_model=List[ReporterWithUser])
def list_reporters(db: Session = Depends(get_db)):
    return db.query(Reporter).order_by(Reporter.is_approved.asc(), Reporter.created_at.desc()).all()

@router.post("/reporters/{id}/approve", response_model=ReporterWithUser)
def approve_reporter(
    id: int, 
    approve: bool, 
    db: Session = Depends(get_db)
):
    reporter = db.query(Reporter).filter(Reporter.id == id).first()
    if not reporter:
        raise HTTPException(status_code=404, detail="Reporter profile not found")
    
    reporter.is_approved = approve
    db.commit()
    db.refresh(reporter)
    
    # Create notification for reporter user
    status_str = "approved" if approve else "rejected"
    NotificationService.create_notification(
        db, reporter.user_id, "Reporter Profile Update",
        f"Your application for district reporting in {reporter.district} has been {status_str}."
    )
    
    return reporter

@router.get("/users", response_model=List[UserOut])
def list_users(db: Session = Depends(get_db)):
    return db.query(User).order_by(User.created_at.desc()).all()

@router.post("/users/{id}/toggle-status", response_model=UserOut)
def toggle_user_active_status(id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Avoid blocking self
    # We don't have direct access to self context here unless we inject Depends(get_current_user)
    # But let's check role name: we shouldn't block admin accounts generally
    if user.role.name == "admin":
        # Check how many admin users there are
        admin_role = db.query(Role).filter(Role.name == "admin").first()
        admin_count = db.query(User).filter(User.role_id == admin_role.id, User.is_active == True).count()
        if admin_count <= 1 and user.is_active:
            raise HTTPException(status_code=400, detail="Cannot block the only active administrator account.")

    user.is_active = not user.is_active
    db.commit()
    db.refresh(user)
    return user
