from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

from .firebase import get_firestore_client
from .routes import users, foods, scan

# Load environment variables
load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Starting Allergen-Aware Recipe Advisor API...")
    # Test Firebase connection
    try:
        db = get_firestore_client()
        list(db.collections())  # Trigger a simple request
        print("SUCCESS: Firebase connection successful")
    except Exception as e:
        print(f"ERROR: Firebase connection failed: {e}")
    
    yield
    
    # Shutdown
    print("Shutting down Allergen-Aware Recipe Advisor API...")

# Initialize FastAPI app
app = FastAPI(
    title="Allergen-Aware Recipe Advisor API",
    description="A FastAPI backend for food allergen analysis using Firebase, FatSecret, and Gemini AI",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers with versioned prefixes
app.include_router(users.router, prefix="/api/v1/users", tags=["users"])
app.include_router(foods.router, prefix="/api/v1/foods", tags=["foods"])
app.include_router(scan.router, prefix="/api/v1/scan", tags=["scan"])

@app.get("/")
async def root():
    return {
        "message": "Allergen-Aware Recipe Advisor API",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "allergen-aware-recipe-advisor"}