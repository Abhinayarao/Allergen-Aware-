from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

from .auth import supabase_client
from .routes import users, foods, scan

# Load environment variables
load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Starting Allergen-Aware Recipe Advisor API...")
    # Test Supabase connection
    try:
        response = supabase_client.table('users').select('*').limit(1).execute()
        print("✅ Supabase connection successful")
    except Exception as e:
        print(f"❌ Supabase connection failed: {e}")
    
    yield
    
    # Shutdown
    print("Shutting down Allergen-Aware Recipe Advisor API...")

# Initialize FastAPI app
app = FastAPI(
    title="Allergen-Aware Recipe Advisor API",
    description="A FastAPI backend for food allergen analysis using Supabase, FatSecret, and Gemini AI",
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

# Include routers
app.include_router(users.router, prefix="/api/v1", tags=["users"])
app.include_router(foods.router, prefix="/api/v1", tags=["foods"])
app.include_router(scan.router, prefix="/api/v1", tags=["scan"])

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