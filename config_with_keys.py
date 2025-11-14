# Configuration file with your API keys
# Copy these values to your .env file

ENV_CONTENT = """
# Firebase Configuration
FIREBASE_PROJECT_ID=allergen-aware-ad181
FIREBASE_API_KEY=AIzaSyD2zGtY3Z0NqTq-0f7aTqQmZ40bMm4F-kE
FIREBASE_SERVICE_ACCOUNT_FILE=path/to/serviceAccountKey.json
# FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}

# FatSecret API Configuration
FATSECRET_KEY=2747207f22504521a277070984144066
FATSECRET_SECRET=10670465502257543049

# Google Gemini AI Configuration
GEMINI_KEY=AIzaSyBbGdLs-a-i03XHnYcAjm3lB2e1vV43Bw0

# Environment
ENVIRONMENT=development
HOST=0.0.0.0
PORT=8000
"""

print("Please create a .env file in the root directory with the following content:")
print(ENV_CONTENT)
