# 🚀 Quick Start Guide - Allergen-Aware Recipe Advisor API

## ✅ Your API Keys Are Configured!

Your environment is now set up with the following API keys:
- ✅ **Supabase**: Connected to your project
- ✅ **Google Gemini AI**: Ready for allergen analysis
- ⚠️ **FatSecret**: You need to get your consumer secret

## 🔧 Complete Setup Steps

### 1. Get Your FatSecret Consumer Secret

1. Visit: https://platform.fatsecret.com/api/Default.aspx?screen=app
2. Log in to your FatSecret developer account
3. Find your app and copy the **Consumer Secret**
4. Update your `.env` file:
   ```
   FATSECRET_SECRET=your-actual-consumer-secret-here
   ```

### 2. Set Up Your Supabase Database

1. Go to your Supabase project: https://supabase.com/dashboard/project/hawkjasruzxwjcmsjvvg
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `database_setup.sql`
4. Click **Run** to execute the SQL

### 3. Start the API Server

```bash
python run.py
```

You should see output like:
```
🚀 Starting Allergen-Aware Recipe Advisor API...
✅ Environment: development
✅ Host: 0.0.0.0
✅ Port: 8000
✅ Reload: True
✅ Log Level: info
📚 API Documentation: http://0.0.0.0:8000/docs
📖 ReDoc Documentation: http://0.0.0.0:8000/redoc
🏥 Health Check: http://0.0.0.0:8000/health
```

## 🧪 Test Your API

### 1. Health Check
```bash
curl http://localhost:8000/health
```

### 2. API Documentation
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### 3. Test User Registration
```bash
curl -X POST "http://localhost:8000/api/v1/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword123",
    "first_name": "Test",
    "last_name": "User"
  }'
```

### 4. Test Food Search
```bash
curl "http://localhost:8000/api/v1/foods/search?query=chicken&max_results=5"
```

## 🔑 API Endpoints Overview

### Authentication
- `POST /api/v1/register` - Register new user
- `POST /api/v1/login` - Login user
- `POST /api/v1/logout` - Logout user

### User Management
- `GET /api/v1/profile` - Get user profile
- `PUT /api/v1/profile` - Update user profile
- `GET /api/v1/allergens` - Get allergen profile
- `PUT /api/v1/allergens` - Update allergen profile

### Food Analysis
- `GET /api/v1/foods/search` - Search foods
- `GET /api/v1/foods/{food_id}` - Get food details
- `POST /api/v1/scan/image` - Scan food image
- `POST /api/v1/scan/barcode` - Scan barcode
- `POST /api/v1/scan/voice` - Process voice input
- `POST /api/v1/scan/analyze` - Analyze food for allergens

## 🐳 Docker Setup (Alternative)

If you prefer Docker:

```bash
# Build and run with Docker Compose
docker-compose up --build

# Or build and run manually
docker build -t allergen-advisor-api .
docker run -p 8000:8000 --env-file .env allergen-advisor-api
```

## 🧪 Testing with Python

```python
import requests

# Base URL
BASE_URL = "http://localhost:8000/api/v1"

# Test health check
response = requests.get("http://localhost:8000/health")
print("Health:", response.json())

# Test food search
response = requests.get(f"{BASE_URL}/foods/search?query=chicken")
print("Food search:", response.json())
```

## 🧪 Testing with JavaScript

```javascript
// Test health check
fetch('http://localhost:8000/health')
  .then(response => response.json())
  .then(data => console.log('Health:', data));

// Test food search
fetch('http://localhost:8000/api/v1/foods/search?query=chicken')
  .then(response => response.json())
  .then(data => console.log('Food search:', data));
```

## 🔧 Troubleshooting

### Common Issues

1. **"Missing required environment variables"**
   - Make sure your `.env` file exists and has all required keys
   - Check that you've added your FatSecret consumer secret

2. **"Supabase connection failed"**
   - Verify your Supabase URL and key are correct
   - Make sure you've run the database setup SQL

3. **"FatSecret API request failed"**
   - Check your FatSecret key and secret
   - Verify you have API access (free tier: 1000 requests/day)

4. **"Gemini API failed"**
   - Verify your Gemini API key is correct
   - Check your Google Cloud quota

### Debug Mode

To run with debug logging:
```bash
LOG_LEVEL=debug python run.py
```

## 📚 Next Steps

1. **Get your FatSecret consumer secret** (required for food search)
2. **Set up your Supabase database** (run the SQL setup)
3. **Test the API endpoints** using the documentation
4. **Integrate with your frontend** using the API endpoints

## 🎉 You're Ready!

Your FastAPI backend is now configured and ready to use! The API provides:
- ✅ User authentication and management
- ✅ Food search and nutrition data
- ✅ AI-powered allergen analysis
- ✅ Multiple scan methods (image, barcode, voice)
- ✅ Comprehensive documentation

Visit http://localhost:8000/docs to explore the full API documentation!
