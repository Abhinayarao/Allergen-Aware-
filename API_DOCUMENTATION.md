# Allergen-Aware Recipe Advisor API Documentation

## Overview

The Allergen-Aware Recipe Advisor API is a comprehensive FastAPI backend that provides food allergen analysis using Firebase, FatSecret API, and Google Gemini AI. The API supports multiple input methods (image, barcode, voice) and provides intelligent allergen risk assessment.

## Base URL

```
http://localhost:8000/api/v1
```

## Authentication

Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### Authentication Endpoints

#### Register User
```http
POST /api/v1/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123",
  "first_name": "John",
  "last_name": "Doe"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user_id": "uuid",
  "email": "user@example.com"
}
```

#### Login User
```http
POST /api/v1/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "access_token": "jwt-token",
  "refresh_token": "refresh-token",
  "user_id": "uuid",
  "email": "user@example.com"
}
```

#### Logout User
```http
POST /api/v1/logout
Authorization: Bearer <token>
```

### User Profile Endpoints

#### Get User Profile
```http
GET /api/v1/profile
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+1234567890",
  "date_of_birth": "1990-01-01",
  "emergency_contact": "+1234567890",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

#### Update User Profile
```http
PUT /api/v1/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+1234567890",
  "date_of_birth": "1990-01-01",
  "emergency_contact": "+1234567890"
}
```

### Allergen Profile Endpoints

#### Get Allergen Profile
```http
GET /api/v1/allergens
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "peanuts": true,
  "tree_nuts": false,
  "shellfish": true,
  "fish": false,
  "gluten": false,
  "dairy": true,
  "eggs": false,
  "soy": false,
  "sesame": false,
  "sulfites": false,
  "mustard": false,
  "celery": false,
  "lupin": false,
  "mollusks": false,
  "custom_allergens": ["citrus"],
  "severity_level": "moderate",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

#### Update Allergen Profile
```http
PUT /api/v1/allergens
Authorization: Bearer <token>
Content-Type: application/json

{
  "peanuts": true,
  "tree_nuts": false,
  "shellfish": true,
  "dairy": true,
  "custom_allergens": ["citrus"],
  "severity_level": "moderate"
}
```

### Food Search Endpoints

#### Search Foods
```http
GET /api/v1/foods/search?query=chicken&max_results=10
```

**Response:**
```json
{
  "foods": [
    {
      "food_id": "12345",
      "food_name": "Chicken Breast",
      "brand_name": "Generic",
      "food_type": "Generic",
      "food_url": "https://example.com",
      "food_description": "Raw chicken breast"
    }
  ],
  "total_results": 1,
  "page_number": 0,
  "max_results": 10
}
```

#### Get Food Details
```http
GET /api/v1/foods/{food_id}
```

**Response:**
```json
{
  "food_id": "12345",
  "food_name": "Chicken Breast",
  "brand_name": "Generic",
  "food_type": "Generic",
  "food_url": "https://example.com",
  "food_description": "Raw chicken breast",
  "ingredients": ["chicken breast"],
  "nutrition": {
    "calories": 165,
    "protein": 31,
    "carbohydrates": 0,
    "fat": 3.6,
    "fiber": 0,
    "sugar": 0,
    "sodium": 74,
    "cholesterol": 85,
    "saturated_fat": 1,
    "serving_size": "100g",
    "serving_unit": "grams"
  },
  "allergens": []
}
```

### Scanning Endpoints

#### Scan Image
```http
POST /api/v1/scan/image
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <image-file>
```

**Response:**
```json
{
  "success": true,
  "food_details": {
    "food_id": "image_scan_001",
    "food_name": "Chicken Sandwich",
    "ingredients": ["bread", "chicken", "lettuce", "tomato"],
    "nutrition": {
      "calories": 350,
      "protein": 25,
      "carbohydrates": 30,
      "fat": 15
    }
  },
  "error_message": null
}
```

#### Scan Barcode
```http
POST /api/v1/scan/barcode
Authorization: Bearer <token>
Content-Type: application/json

{
  "barcode": "1234567890123"
}
```

#### Scan Voice Input
```http
POST /api/v1/scan/voice
Authorization: Bearer <token>
Content-Type: application/json

{
  "text": "chicken sandwich",
  "audio_base64": "base64-encoded-audio-data"
}
```

### Allergen Analysis Endpoint

#### Analyze Food for Allergens
```http
POST /api/v1/scan/analyze
Authorization: Bearer <token>
Content-Type: application/json

{
  "food_id": "12345",
  "food_name": "Chicken Sandwich",
  "ingredients": ["bread", "chicken", "lettuce", "tomato"],
  "nutrition": {
    "calories": 350,
    "protein": 25,
    "carbohydrates": 30,
    "fat": 15
  }
}
```

**Response:**
```json
{
  "food_name": "Chicken Sandwich",
  "is_safe": true,
  "risk_level": "low",
  "detected_allergens": [],
  "risk_factors": [],
  "recommendations": ["Safe to consume"],
  "alternative_suggestions": [],
  "confidence_score": 0.95,
  "analysis_details": "No allergens detected in this food item."
}
```

## Error Responses

### 400 Bad Request
```json
{
  "detail": "Invalid input data"
}
```

### 401 Unauthorized
```json
{
  "detail": "Invalid token"
}
```

### 404 Not Found
```json
{
  "detail": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "detail": "Internal server error"
}
```

## Rate Limits

- **FatSecret API**: 1000 requests/day (free tier)
- **Gemini AI**: Based on your Google Cloud quota
- **Firebase**: Firestore/Authentication quotas depend on your Google Cloud plan

## Data Models

### User Model
```json
{
  "id": "string (UUID)",
  "email": "string (email)",
  "first_name": "string (optional)",
  "last_name": "string (optional)",
  "phone": "string (optional)",
  "date_of_birth": "string (optional)",
  "emergency_contact": "string (optional)",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### Allergen Profile Model
```json
{
  "id": "string (UUID)",
  "user_id": "string (UUID)",
  "peanuts": "boolean",
  "tree_nuts": "boolean",
  "shellfish": "boolean",
  "fish": "boolean",
  "gluten": "boolean",
  "dairy": "boolean",
  "eggs": "boolean",
  "soy": "boolean",
  "sesame": "boolean",
  "sulfites": "boolean",
  "mustard": "boolean",
  "celery": "boolean",
  "lupin": "boolean",
  "mollusks": "boolean",
  "custom_allergens": "array of strings",
  "severity_level": "string (mild|moderate|severe)",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### Food Model
```json
{
  "food_id": "string",
  "food_name": "string",
  "brand_name": "string (optional)",
  "food_type": "string (optional)",
  "food_url": "string (optional)",
  "food_description": "string (optional)",
  "ingredients": "array of strings (optional)",
  "nutrition": "object (optional)",
  "allergens": "array of strings (optional)",
  "barcode": "string (optional)"
}
```

### Nutrition Model
```json
{
  "calories": "number (optional)",
  "protein": "number (optional)",
  "carbohydrates": "number (optional)",
  "fat": "number (optional)",
  "fiber": "number (optional)",
  "sugar": "number (optional)",
  "sodium": "number (optional)",
  "cholesterol": "number (optional)",
  "saturated_fat": "number (optional)",
  "trans_fat": "number (optional)",
  "serving_size": "string (optional)",
  "serving_unit": "string (optional)"
}
```

## SDK Examples

### Python
```python
import requests

# Base URL
BASE_URL = "http://localhost:8000/api/v1"

# Register user
response = requests.post(f"{BASE_URL}/register", json={
    "email": "user@example.com",
    "password": "securepassword123",
    "first_name": "John",
    "last_name": "Doe"
})

# Login
response = requests.post(f"{BASE_URL}/login", json={
    "email": "user@example.com",
    "password": "securepassword123"
})
token = response.json()["access_token"]

# Search foods
headers = {"Authorization": f"Bearer {token}"}
response = requests.get(f"{BASE_URL}/foods/search?query=chicken", headers=headers)
```

### JavaScript
```javascript
const BASE_URL = "http://localhost:8000/api/v1";

// Register user
const registerResponse = await fetch(`${BASE_URL}/register`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'securepassword123',
    first_name: 'John',
    last_name: 'Doe'
  })
});

// Login
const loginResponse = await fetch(`${BASE_URL}/login`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'securepassword123'
  })
});
const { access_token } = await loginResponse.json();

// Search foods
const searchResponse = await fetch(`${BASE_URL}/foods/search?query=chicken`, {
  headers: {
    'Authorization': `Bearer ${access_token}`
  }
});
```

## Testing

### Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "service": "allergen-aware-recipe-advisor"
}
```

### API Documentation
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Support

For support and questions:
- Check the API documentation at `/docs`
- Review the error responses for troubleshooting
- Ensure all required environment variables are set
- Verify API key configurations
