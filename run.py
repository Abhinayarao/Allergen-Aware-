#!/usr/bin/env python3
"""
Startup script for the Allergen-Aware Recipe Advisor FastAPI backend.
"""

import uvicorn
import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def check_environment():
    """Check if all required environment variables are set."""
    required_vars = [
        "SUPABASE_URL",
        "SUPABASE_KEY", 
        "FATSECRET_KEY",
        "FATSECRET_SECRET",
        "GEMINI_KEY"
    ]
    
    missing_vars = []
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        print("❌ Missing required environment variables:")
        for var in missing_vars:
            print(f"   - {var}")
        print("\nPlease set these variables in your .env file or environment.")
        return False
    
    return True

def main():
    """Main startup function."""
    print("🚀 Starting Allergen-Aware Recipe Advisor API...")
    
    # Check environment variables
    if not check_environment():
        sys.exit(1)
    
    # Get configuration from environment
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    environment = os.getenv("ENVIRONMENT", "development")
    reload = environment == "development"
    log_level = os.getenv("LOG_LEVEL", "info")
    
    print(f"✅ Environment: {environment}")
    print(f"✅ Host: {host}")
    print(f"✅ Port: {port}")
    print(f"✅ Reload: {reload}")
    print(f"✅ Log Level: {log_level}")
    print(f"📚 API Documentation: http://{host}:{port}/docs")
    print(f"📖 ReDoc Documentation: http://{host}:{port}/redoc")
    print(f"🏥 Health Check: http://{host}:{port}/health")
    
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
        print("\n🛑 Shutting down gracefully...")
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
