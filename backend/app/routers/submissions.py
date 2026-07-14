from fastapi import APIRouter, Depends, Form, File, UploadFile, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.schemas import SubmissionOut, SubmissionCreate
from app.services import SubmissionService, MediaService

router = APIRouter(prefix="/submissions", tags=["Submissions"])

@router.post("/submit", response_model=SubmissionOut, status_code=status.HTTP_201_CREATED)
def create_submission(
    submission_type: str = Form(...),
    title: str = Form(...),
    content: str = Form(...),
    reporter_name: Optional[str] = Form(None),
    reporter_email: str = Form(...),
    district: Optional[str] = Form(None),
    youtube_url: Optional[str] = Form(None),
    images: Optional[List[UploadFile]] = File(None),
    db: Session = Depends(get_db)
):
    # Validate type
    if submission_type not in ["tip", "complaint", "opinion"]:
        raise HTTPException(status_code=400, detail="Invalid submission type. Must be: tip, complaint, opinion")

    # Local validations
    saved_images = []
    if images:
        for img in images:
            if img.filename:
                path = MediaService.save_image_upload(img)
                saved_images.append(path)

    # Perform Pydantic Validation via SubmissionCreate model
    try:
        sub_in = SubmissionCreate(
            submission_type=submission_type,
            title=title,
            content=content,
            reporter_name=reporter_name,
            reporter_email=reporter_email,
            district=district,
            youtube_url=youtube_url
        )
    except ValueError as e:
        raise HTTPException(status_code=420, detail=str(e))

    return SubmissionService.create_submission(db, sub_in, image_paths=saved_images)
