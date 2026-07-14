from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, create_access_token, get_current_user
from app.schemas import Token, UserCreate, ReporterCreate, UserOut, UserWithRole, ReporterOut
from app.services import UserService
from app.models import User

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=Token)
def login(db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()):
    # Get user
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="User accounts blocked/inactive")

    # Generate JWT
    access_token = create_access_token(subject=user.id)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role.name,
        "full_name": user.full_name,
        "user_id": user.id
    }

@router.post("/register", response_model=UserOut)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    return UserService.create_user(db, user_in, role_name="user")

@router.post("/register/reporter", response_model=ReporterOut)
def register_reporter(rep_in: ReporterCreate, db: Session = Depends(get_db)):
    return UserService.create_reporter(db, rep_in)

@router.get("/me", response_model=UserWithRole)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
