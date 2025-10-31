#!/usr/bin/env python3
"""
Environment setup script for the Allergen-Aware Recipe Advisor API.
This script will create the .env file with your API keys.
"""

import os
from pathlib import Path

def create_env_file():
    """Create .env file with the provided API keys."""
    
    # Your API keys
    SUPABASE_URL = "https://hawkjasruzxwjcmsjvvg.supabase.co"
    SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhhd2tqYXNydXp4d2pjbXNqdnZnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDEyMTgzNCwiZXhwIjoyMDc1Njk3ODM0fQ.EVBNpbyiPyNgMTTyJ8A76rggRGtkftpWTSeWv04urno"
    FATSECRET_KEY = "3ac956f1edf044f3a36a002a54bacc46"
    GEMINI_KEY = "AIzaSyBKsopQBX7BFoPfRY0hWzbNU-A9clPnzKo"
    
    # Environment configuration
    env_content = f"""# Supabase Configuration
SUPABASE_URL={SUPABASE_URL}
SUPABASE_KEY={SUPABASE_KEY}

# FatSecret API Configuration
FATSECRET_KEY={FATSECRET_KEY}
FATSECRET_SECRET=your-fatsecret-consumer-secret

# Google Gemini AI Configuration
GEMINI_KEY={GEMINI_KEY}

# JWT Secret (for token signing)
JWT_SECRET=your-jwt-secret-key-change-this-in-production

# Environment
ENVIRONMENT=development
HOST=0.0.0.0
PORT=8000
LOG_LEVEL=info
"""
    
    # Write to .env file
    env_file = Path(".env")
    with open(env_file, "w") as f:
        f.write(env_content)
    
    print("✅ .env file created successfully!")
    print("⚠️  Note: You still need to get your FatSecret consumer secret from the FatSecret developer portal.")
    print("   Visit: https://platform.fatsecret.com/api/Default.aspx?screen=app")
    
    return True

def main():
    """Main setup function."""
    print("🔧 Setting up environment configuration...")
    
    if create_env_file():
        print("\n🎉 Environment setup completed!")
        print("\nNext steps:")
        print("1. Get your FatSecret consumer secret from: https://platform.fatsecret.com/api/Default.aspx?screen=app")
        print("2. Update the FATSECRET_SECRET in your .env file")
        print("3. Run the database setup SQL in your Supabase project")
        print("4. Start the server with: python run.py")
        print("\n📚 Documentation will be available at:")
        print("   - API Docs: http://localhost:8000/docs")
        print("   - ReDoc: http://localhost:8000/redoc")
        print("   - Health Check: http://localhost:8000/health")
    else:
        print("❌ Failed to create .env file")

if __name__ == "__main__":
    main()
