#!/usr/bin/env python3
"""
Startup script for the Allergen-Aware Recipe Advisor FastAPI backend.
"""

import os
import sys
from pathlib import Path

import uvicorn
from dotenv import load_dotenv


CURRENT_DIR = Path(__file__).resolve().parent
PARENT_DIR = CURRENT_DIR.parent

for path in (CURRENT_DIR, PARENT_DIR):
    path_str = str(path)
    if path_str not in sys.path:
        sys.path.insert(0, path_str)

# Load environment variables
load_dotenv()

def check_environment():
    """Check if suggestion-worthy environment variables are set."""
    required_vars = [
        "FATSECRET_KEY",
        "FATSECRET_SECRET",
        "GEMINI_KEY",
    ]

    missing_required = [var for var in required_vars if not os.getenv(var)]

    if missing_required:
        print("WARNING: Missing environment variables detected:")
        for var in missing_required:
            print(f"   - {var}")
        print(
            "These features will be limited until the variables are provided. "
            "Set them in your .env file or environment to enable full functionality."
        )

    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")
    if not supabase_url or not supabase_key:
        print(
            "WARNING: SUPABASE_URL/SUPABASE_KEY are not configured. "
            "Supabase features are deprecated but leaving these unset is now allowed."
        )

    return True

def main():
    """Main startup function."""
    print("Starting Allergen-Aware Recipe Advisor API...")
    
    # Check environment variables
    if not check_environment():
        print("Continuing startup despite missing environment variables.")
    
    # Get configuration from environment
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    environment = os.getenv("ENVIRONMENT", "development")
    reload = environment == "development"
    log_level = os.getenv("LOG_LEVEL", "info")
    
    print(f"Environment: {environment}")
    print(f"Host: {host}")
    print(f"Port: {port}")
    print(f"Reload: {reload}")
    print(f"Log Level: {log_level}")
    print(f"API Documentation: http://{host}:{port}/docs")
    print(f"ReDoc Documentation: http://{host}:{port}/redoc")
    print(f"Health Check: http://{host}:{port}/health")
    
    try:
        uvicorn.run(
            "app.main:app",
            host=host,
            port=port,
            reload=reload,
            log_level=log_level,
            access_log=True
        )
    except KeyboardInterrupt:
        print("\nShutting down gracefully...")
    except Exception as e:
        print(f"ERROR: Error starting server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
