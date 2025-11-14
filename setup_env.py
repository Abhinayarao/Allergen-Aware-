#!/usr/bin/env python3
"""
Environment setup script for the Allergen-Aware Recipe Advisor API.
This script will create the .env file with your API keys.
"""

import os
from pathlib import Path

def create_env_file():
    """Create .env file with the provided API keys."""
    
    # Placeholder API keys
    FATSECRET_KEY = "your-fatsecret-consumer-key"
    GEMINI_KEY = "your-google-gemini-api-key"
    
    # Environment configuration
    env_content = f"""# Firebase Configuration
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_API_KEY=your-firebase-web-api-key
# Provide ONE of the following service account options:
FIREBASE_SERVICE_ACCOUNT_FILE=path/to/serviceAccountKey.json
# FIREBASE_SERVICE_ACCOUNT_JSON={{"type":"service_account",...}}

# FatSecret API Configuration
FATSECRET_KEY={FATSECRET_KEY}
FATSECRET_SECRET=your-fatsecret-consumer-secret

# Google Gemini AI Configuration
GEMINI_KEY={GEMINI_KEY}

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
        print("1. Download your Firebase service account JSON from the Firebase console")
        print("2. Update the Firebase variables in your .env file (project id, API key, service account)")
        print("3. Get your FatSecret consumer secret from: https://platform.fatsecret.com/api/Default.aspx?screen=app")
        print("4. Update the FATSECRET_SECRET in your .env file")
        print("5. Start the server with: python run.py")
        print("\n📚 Documentation will be available at:")
        print("   - API Docs: http://localhost:8000/docs")
        print("   - ReDoc: http://localhost:8000/redoc")
        print("   - Health Check: http://localhost:8000/health")
    else:
        print("❌ Failed to create .env file")

if __name__ == "__main__":
    main()
