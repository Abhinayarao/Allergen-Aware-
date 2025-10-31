from fastapi import APIRouter, HTTPException, UploadFile, File, Depends, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import base64
import io
from typing import Optional
import jwt

from ..services.fatsecret import fatsecret_service
from ..services.gemini import gemini_service
from ..auth import get_supabase_client
from ..models.food import ScanResponse, FoodDetails, BarcodeScanRequest, VoiceInputRequest
from ..models.allergen import AllergenAnalysis

router = APIRouter()
security = HTTPBearer()

def get_current_user_id(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """Extract user ID from JWT token."""
    try:
        payload = jwt.decode(credentials.credentials, options={"verify_signature": False})
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_user_allergens(user_id: str) -> dict:
    """Get user's allergen profile."""
    supabase = get_supabase_client()
    try:
        response = supabase.table("allergen_profiles").select("*").eq("user_id", user_id).execute()
        if response.data:
            return response.data[0]
        else:
            return {}  # Return empty dict if no allergen profile
    except Exception:
        return {}

@router.post("/image", response_model=ScanResponse)
async def scan_image(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id)
):
    """Scan an image to identify food and analyze for allergens."""
    try:
        # Read the uploaded image
        image_data = await file.read()
        
        # For now, we'll simulate image recognition
        # In production, you'd use a proper image recognition service
        # This could be FatSecret's image recognition API or another ML service
        
        # Simulate food identification (replace with actual image recognition)
        identified_food = {
            "food_name": "Sample Food Item",
            "ingredients": ["wheat flour", "eggs", "milk", "sugar"],
            "nutrition": {
                "calories": 250,
                "protein": 8.5,
                "carbohydrates": 35.2,
                "fat": 9.1
            }
        }
        
        # Get user's allergen profile
        user_allergens = await get_user_allergens(user_id)
        
        # Analyze for allergens using Gemini AI
        analysis = await gemini_service.analyze_allergens(user_allergens, identified_food)
        
        # Create food details
        food_details = FoodDetails(
            food_id="image_scan_001",
            food_name=identified_food["food_name"],
            ingredients=identified_food["ingredients"],
            nutrition=identified_food["nutrition"]
        )
        
        return ScanResponse(
            success=True,
            food_details=food_details,
            error_message=None
        )
        
    except Exception as e:
        return ScanResponse(
            success=False,
            food_details=None,
            error_message=f"Image scan failed: {str(e)}"
        )

@router.post("/barcode", response_model=ScanResponse)
async def scan_barcode(
    barcode_data: BarcodeScanRequest,
    user_id: str = Depends(get_current_user_id)
):
    """Scan a barcode to identify food and analyze for allergens."""
    try:
        # Search for food by barcode using FatSecret
        result = await fatsecret_service.search_by_barcode(barcode_data.barcode)
        
        if "food_id" not in result:
            return ScanResponse(
                success=False,
                food_details=None,
                error_message="Food not found for this barcode"
            )
        
        # Get detailed food information
        food_id = result["food_id"]
        food_details_result = await fatsecret_service.get_food_details(food_id)
        
        # Parse food details
        food_data = food_details_result.get("food", {})
        
        # Extract ingredients
        ingredients = []
        if "ingredients" in food_data and food_data["ingredients"]:
            ingredients = [ingredient.strip() for ingredient in food_data["ingredients"].split(",")]
        
        # Create food details object
        food_details = FoodDetails(
            food_id=food_data.get("food_id", food_id),
            food_name=food_data.get("food_name", ""),
            brand_name=food_data.get("brand_name"),
            food_type=food_data.get("food_type"),
            food_url=food_data.get("food_url"),
            food_description=food_data.get("food_description"),
            ingredients=ingredients,
            barcode=barcode_data.barcode
        )
        
        return ScanResponse(
            success=True,
            food_details=food_details,
            error_message=None
        )
        
    except Exception as e:
        return ScanResponse(
            success=False,
            food_details=None,
            error_message=f"Barcode scan failed: {str(e)}"
        )

@router.post("/voice", response_model=ScanResponse)
async def scan_voice(
    voice_data: VoiceInputRequest,
    user_id: str = Depends(get_current_user_id)
):
    """Process voice input to identify food and analyze for allergens."""
    try:
        text = voice_data.text
        
        # If audio is provided, decode and transcribe (simplified)
        if voice_data.audio_base64 and not text:
            # In production, you'd use a speech-to-text service like Google Speech-to-Text
            # For now, we'll simulate transcription
            text = "chicken sandwich"  # Simulated transcription
        
        if not text:
            return ScanResponse(
                success=False,
                food_details=None,
                error_message="No text or audio provided"
            )
        
        # Search for food using the transcribed text
        search_result = await fatsecret_service.search_foods(text, max_results=1)
        
        if "foods" not in search_result or "food" not in search_result["foods"]:
            return ScanResponse(
                success=False,
                food_details=None,
                error_message="No food found for the given description"
            )
        
        # Get the first result
        food_list = search_result["foods"]["food"]
        if not isinstance(food_list, list):
            food_list = [food_list]
        
        if not food_list:
            return ScanResponse(
                success=False,
                food_details=None,
                error_message="No food found for the given description"
            )
        
        # Get detailed information
        food_id = food_list[0]["food_id"]
        food_details_result = await fatsecret_service.get_food_details(food_id)
        
        # Parse food details
        food_data = food_details_result.get("food", {})
        
        # Extract ingredients
        ingredients = []
        if "ingredients" in food_data and food_data["ingredients"]:
            ingredients = [ingredient.strip() for ingredient in food_data["ingredients"].split(",")]
        
        # Create food details object
        food_details = FoodDetails(
            food_id=food_data.get("food_id", food_id),
            food_name=food_data.get("food_name", ""),
            brand_name=food_data.get("brand_name"),
            food_type=food_data.get("food_type"),
            food_url=food_data.get("food_url"),
            food_description=food_data.get("food_description"),
            ingredients=ingredients
        )
        
        return ScanResponse(
            success=True,
            food_details=food_details,
            error_message=None
        )
        
    except Exception as e:
        return ScanResponse(
            success=False,
            food_details=None,
            error_message=f"Voice scan failed: {str(e)}"
        )

@router.post("/analyze", response_model=AllergenAnalysis)
async def analyze_food_allergens(
    food_details: FoodDetails,
    user_id: str = Depends(get_current_user_id)
):
    """Analyze a food item for allergen risks."""
    try:
        # Get user's allergen profile
        user_allergens = await get_user_allergens(user_id)
        
        # Prepare food information for analysis
        food_info = {
            "food_name": food_details.food_name,
            "ingredients": food_details.ingredients or [],
            "nutrition": food_details.nutrition.dict() if food_details.nutrition else {}
        }
        
        # Analyze using Gemini AI
        analysis_result = await gemini_service.analyze_allergens(user_allergens, food_info)
        
        # Convert to AllergenAnalysis model
        allergen_analysis = AllergenAnalysis(
            food_name=food_details.food_name,
            is_safe=analysis_result.get("is_safe", True),
            risk_level=analysis_result.get("risk_level", "low"),
            detected_allergens=analysis_result.get("detected_allergens", []),
            risk_factors=analysis_result.get("risk_factors", []),
            recommendations=analysis_result.get("recommendations", []),
            alternative_suggestions=analysis_result.get("alternative_suggestions", []),
            confidence_score=analysis_result.get("confidence_score", 0.5),
            analysis_details=analysis_result.get("analysis_details", "")
        )
        
        return allergen_analysis
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Allergen analysis failed: {str(e)}")
