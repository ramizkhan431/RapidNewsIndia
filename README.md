# RapidNewsIndia

RapidNewsIndia is a full-stack news platform with a FastAPI backend and a Next.js frontend. It supports news browsing, submissions, admin management, and notifications.

## Project Structure

- backend/: FastAPI application, API routes, database models, and services
- frontend/: Next.js app for the public website and admin UI

## Tech Stack

- Backend: Python, FastAPI, SQLAlchemy, Pydantic
- Frontend: Next.js, React, TypeScript, Tailwind CSS

## Getting Started

### 1. Backend

Navigate to the backend folder and create or activate a virtual environment:

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

Start the API server:

```bash
uvicorn main:app --reload
```

The API will be available at http://127.0.0.1:8000.

### 2. Frontend

Navigate to the frontend folder and install dependencies:

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at http://localhost:3000.

## Features

- Browse news articles
- Submit news content
- Admin dashboard and moderation tools
- Notifications and category-based organization

## Notes

- The backend uses environment-based configuration and local database settings.
- Make sure both services are running if you want to use the full application experience.
