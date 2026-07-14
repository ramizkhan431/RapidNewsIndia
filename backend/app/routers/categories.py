from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.security import RoleChecker
from app.schemas import CategoryCreate, CategoryOut, CategoryTreeOut
from app.services import CategoryService
from app.models import Category

router = APIRouter(prefix="/categories", tags=["Categories"])

@router.get("", response_model=List[CategoryTreeOut])
def get_categories(db: Session = Depends(get_db)):
    return CategoryService.get_categories_tree(db)

@router.post("/create", response_model=CategoryOut, dependencies=[Depends(RoleChecker(["admin"]))])
def create_category(cat_in: CategoryCreate, db: Session = Depends(get_db)):
    return CategoryService.create_category(db, cat_in)
