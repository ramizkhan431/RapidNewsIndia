import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.services import init_roles_and_admin
from app.routers import auth, news, categories, submissions, notifications, admin

# Programmatically ensure static upload folder exists prior to mounting
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables if they do not exist
    Base.metadata.create_all(bind=engine)
    
    # Initialize roles, default categories, and admin account
    db = SessionLocal()
    try:
        init_roles_and_admin(db)
    finally:
        db.close()
    
    yield
    # Shutdown: (Cleanup database connections if needed)

app = FastAPI(
    title="Rapid News India API",
    description="Backend services for Rapid News India web application.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Policy
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Swap to specific origins (e.g. ['http://localhost:3000']) in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Static upload folder
app.mount("/static", StaticFiles(directory="static"), name="static")

# Register Routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(news.router, prefix="/api/v1")
app.include_router(categories.router, prefix="/api/v1")
app.include_router(submissions.router, prefix="/api/v1")
app.include_router(notifications.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")

@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "healthy", "service": "Rapid News India Backend", "version": "1.0.0"}
