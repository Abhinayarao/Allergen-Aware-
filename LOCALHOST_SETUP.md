# Localhost Setup Guide

## ✅ Current Status

### Backend (Running)
- **Status**: ✅ Running on http://localhost:8000
- **Health Check**: http://localhost:8000/health
- **API Documentation**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 📋 Prerequisites for Frontend

To run the frontend application, you need to install Node.js first:

1. **Download Node.js**:
   - Visit: https://nodejs.org/
   - Download the LTS version (recommended)
   - Run the installer and follow the setup wizard

2. **Verify Installation**:
   ```bash
   node --version
   npm --version
   ```

## 🚀 Starting the Application

### Backend (Already Running)
The backend is currently running in the background. To restart it:
```bash
python run.py
```

### Frontend (After Installing Node.js)
Once Node.js is installed, run:
```bash
# Install dependencies (first time only)
npm install

# Start the development server
npm run dev
```

The frontend will be available at: **http://localhost:3000**

## 🔧 Environment Setup

### Backend Configuration
The `.env` file has been created from `env.example`. You may need to update:
- `FATSECRET_SECRET`: Get from https://platform.fatsecret.com/api/
- `FIREBASE_*`: Project ID, API key, and service account path/JSON

### Database Setup
1. Go to https://console.firebase.google.com/
2. Select your Firebase project (or create one) and enable **Firestore** in Native mode
3. Download a service account key (JSON) and configure the `FIREBASE_*` variables in `.env`
4. Review Firestore security rules to ensure authenticated access

## 📍 Access Points

- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Frontend**: http://localhost:3000 (after installing Node.js)
- **Health Check**: http://localhost:8000/health

## 🧪 Testing the API

### Health Check
```bash
curl http://localhost:8000/health
```

### Test Food Search
```bash
curl "http://localhost:8000/api/v1/foods/search?query=chicken&max_results=5"
```

## 📝 Next Steps

1. **Install Node.js** (if not already installed)
2. **Install frontend dependencies**: `npm install`
3. **Start the frontend**: `npm run dev`
4. **Update .env file** with your FatSecret consumer secret
5. **Configure Firebase** by enabling Firestore and adding your service account keys to `.env`

## 🐳 Alternative: Use Docker

If you prefer Docker:
```bash
docker-compose up --build
```

This will start both backend and a Redis cache.

## ⚠️ Note

The backend is currently running in the background. The frontend requires Node.js to be installed first. Once you install Node.js and run `npm install` followed by `npm run dev`, your application will be fully operational on localhost.


