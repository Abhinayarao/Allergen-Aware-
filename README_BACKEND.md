# Allergen-Aware Recipe Advisor - FastAPI Backend

A comprehensive FastAPI backend for food allergen analysis using Firebase, FatSecret API, and Google Gemini AI.

## Features

- **User Authentication**: Firebase Authentication integration with ID tokens
- **Food Search**: FatSecret API integration for food database queries
- **Allergen Analysis**: Google Gemini AI for intelligent allergen risk assessment
- **Multiple Scan Methods**: Image, barcode, and voice input support
- **User Profiles**: Comprehensive user and allergen profile management
- **Scan History**: Track and analyze food scan history
- **Favorites**: Save favorite foods for quick access

## Project Structure

```
app/
├── main.py                 # FastAPI app initialization
├── firebase.py             # Firebase initialization helpers
├── config.py               # Environment configuration
├── routes/
│   ├── users.py           # User registration, login, profile management
│   ├── foods.py           # Food search and nutrition information
│   └── scan.py            # Image, barcode, and voice scanning
├── services/
│   ├── fatsecret.py       # FatSecret API wrapper
│   └── gemini.py          # Google Gemini AI wrapper
└── models/
    ├── user.py            # User and profile Pydantic models
    ├── allergen.py        # Allergen profile models
    └── food.py            # Food and nutrition models
```

## Setup Instructions

### 1. Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# Firebase Configuration
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_API_KEY=your-firebase-web-api-key
FIREBASE_SERVICE_ACCOUNT_FILE=path/to/serviceAccountKey.json
# FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}

# FatSecret API Configuration
FATSECRET_KEY=your-fatsecret-consumer-key
FATSECRET_SECRET=your-fatsecret-consumer-secret

# Google Gemini AI Configuration
GEMINI_KEY=your-google-genai-api-key

# Environment
ENVIRONMENT=development
```

### 2. Database Setup

In the Firebase console:

1. Enable **Firestore** in Native mode.
2. Create the following collections when the application runs for the first time (they will be created automatically):
   - `user_profiles`
   - `allergen_profiles`
   - `food_scans`
3. Review Firestore security rules to ensure authenticated access is enforced for your environment.

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Run the Application

```bash
# Development
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Production
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## API Endpoints

### Authentication
- `POST /api/v1/register` - Register a new user
- `POST /api/v1/login` - Login user
- `POST /api/v1/logout` - Logout user

### User Management
- `GET /api/v1/profile` - Get user profile
- `PUT /api/v1/profile` - Update user profile
- `GET /api/v1/allergens` - Get allergen profile
- `PUT /api/v1/allergens` - Update allergen profile

### Food Search
- `GET /api/v1/foods/search` - Search foods by name
- `GET /api/v1/foods/{food_id}` - Get food details
- `GET /api/v1/foods/nutrition/{food_id}` - Get nutrition information

### Scanning
- `POST /api/v1/scan/image` - Scan food image
- `POST /api/v1/scan/barcode` - Scan barcode
- `POST /api/v1/scan/voice` - Process voice input
- `POST /api/v1/scan/analyze` - Analyze food for allergens

## API Documentation

Once the server is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Key Features

### 1. Firebase Integration
- User authentication and authorization with Firebase Auth
- Firestore NoSQL database for profiles, allergens, and history
- Automatic user profile initialisation
- Secure data storage with Firestore security rules

### 2. FatSecret API Integration
- Food search by name
- Barcode lookup
- Detailed nutrition information
- OAuth 1.0 authentication

### 3. Gemini AI Analysis
- Intelligent allergen detection
- Risk assessment and recommendations
- Alternative food suggestions
- Confidence scoring

### 4. Multiple Input Methods
- **Image Scanning**: Upload food images for analysis
- **Barcode Scanning**: Scan product barcodes
- **Voice Input**: Process spoken food descriptions

### 5. Comprehensive Allergen Management
- 14+ common allergens supported
- Custom allergen definitions
- Severity level configuration
- Risk factor analysis

## Security Features

- JWT token authentication
- Row Level Security (RLS) policies
- Input validation with Pydantic
- Secure API key management
- CORS configuration

## Error Handling

- Comprehensive error responses
- Graceful API failure handling
- User-friendly error messages
- Detailed logging for debugging

## Development

### Running Tests
```bash
python -m pytest
```

### Code Formatting
```bash
black app/
isort app/
```

### Type Checking
```bash
mypy app/
```

## Deployment

### Docker
```bash
docker build -t allergen-advisor-api .
docker run -p 8000:8000 --env-file .env allergen-advisor-api
```

### Environment Variables for Production
- Set `ENVIRONMENT=production`
- Use secure JWT secrets
- Configure proper CORS origins
- Set up SSL/TLS certificates

## API Rate Limits

- FatSecret API: 1000 requests/day (free tier)
- Gemini AI: Based on your Google Cloud quota

## Monitoring and Logging

- Application logs via Uvicorn
- Error tracking and monitoring
- Performance metrics
- API usage analytics

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.