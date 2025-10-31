# Configuration file with your API keys
# Copy these values to your .env file

ENV_CONTENT = """
# Supabase Configuration
SUPABASE_URL=https://hawkjasruzxwjcmsjvvg.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhhd2tqYXNydXp4d2pjbXNqdnZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMjE4MzQsImV4cCI6MjA3NTY5NzgzNH0.gZfLAucCk58fzspTu-MqEFqpZFQ-eueKdD5Bjwk-WCE

# FatSecret API Configuration
FATSECRET_KEY=3ac956f1edf044f3a36a002a54bacc46
FATSECRET_SECRET=3ac956f1edf044f3a36a002a54bacc46

# Google Gemini AI Configuration
GEMINI_KEY=AIzaSyBKsopQBX7BFoPfRY0hWzbNU-A9clPnzKo

# JWT Secret (for token signing)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Environment
ENVIRONMENT=development
HOST=0.0.0.0
PORT=8000
"""

print("Please create a .env file in the root directory with the following content:")
print(ENV_CONTENT)
