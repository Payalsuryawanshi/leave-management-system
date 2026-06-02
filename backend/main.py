from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from config import FRONTEND_URL
from routes import auth, leaves, manager, admin

@asynccontextmanager
async def lifespan(app: FastAPI):
    from db import get_connection
    try:
        conn = get_connection()
        conn.close()
        print("Database connection successful")
    except Exception as e:
        print(f"Database connection failed: {e}")
    yield

app = FastAPI(
    title="Leave Management System",
    description="AI-Powered Leave Management",
    version="1.0.0",
    lifespan=lifespan
)

origins = [
    "http://localhost:3000",   # React frontend
    "http://127.0.0.1:3000",   # React frontend alternative
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(leaves.router)
app.include_router(manager.router)
app.include_router(admin.router)

@app.get("/")
async def root():
    return {"message": "Leave Management System API is running", "docs": "/docs"}

@app.get("/health")
async def health_check():
    return {"status": "ok"}