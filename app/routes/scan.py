from fastapi import APIRouter, HTTPException, UploadFile, File, Depends, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import base64
import io
from typing import Optional

from ..services.fatsecret import fatsecret_service
from ..services.gemini import gemini_service
from ..firebase import get_firestore_client, get_firebase_auth
from ..models.food import ScanResponse, FoodDetails, BarcodeScanRequest, VoiceInputRequest
from ..models.allergen import AllergenAnalysis

router = APIRouter()
security = HTTPBearer()

def get_current_user_id(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """Validate Firebase ID token and return the user ID."""
    token = credentials.credentials
    try:
        auth_client = get_firebase_auth()
        decoded = auth_client.verify_id_token(token)
        user_id = decoded.get("uid")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except Exception as exc:
        raise HTTPException(status_code=401, detail="Invalid token") from exc

async def get_user_allergens(user_id: str) -> dict:
    """Get user's allergen profile."""
    db = get_firestore_client()
    try:
        doc = db.collection("allergen_profiles").document(user_id).get()
        if doc.exists:
            return doc.to_dict() or {}
        return {}
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
        from ..services.prompt_builder import prompt_builder_service
        from ..models.food import NutritionInfo
        
        # Get user's allergen profile
        user_allergens = await get_user_allergens(user_id)
        
        # Enrich food information with ingredients if missing
        # This is the key improvement: automatically fetch ingredients
        if not food_details.ingredients or len(food_details.ingredients) == 0:
            print(f"Enriching food '{food_details.food_name}' with ingredients from FatSecret...")
            enriched_info = await prompt_builder_service.enrich_food_with_ingredients(
                food_details.food_name
            )
            
            # Update food_details with enriched information
            food_details.ingredients = enriched_info.get("ingredients", [])
            
            # Update nutrition if missing and we got it from FatSecret
            if not food_details.nutrition and enriched_info.get("nutrition"):
                nutrition_data = enriched_info["nutrition"]
                food_details.nutrition = NutritionInfo(**nutrition_data)
            
            print(f"Enriched ingredients: {food_details.ingredients}")
        
        # Prepare food information for analysis
        food_info = {
            "food_name": food_details.food_name,
            "ingredients": food_details.ingredients or [],
            "nutrition": food_details.nutrition.dict() if food_details.nutrition else {}
        }
        
        # Analyze using Gemini AI with retry logic
        # This uses the new analyze_allergens_with_retry method which:
        # 1. Tries with full structured prompt
        # 2. Retries with simplified prompt if blocked
        analysis_result = await gemini_service.analyze_allergens_with_retry(
            user_allergens, 
            food_info
        )
        
        # Ensure is_safe is a proper boolean
        is_safe_value = analysis_result.get("is_safe", True)
        if isinstance(is_safe_value, str):
            is_safe_value = is_safe_value.lower() in ("true", "1", "yes")
        elif not isinstance(is_safe_value, bool):
            is_safe_value = bool(is_safe_value)
        
        # Ensure confidence_score is a float
        confidence_value = analysis_result.get("confidence_score", 0.5)
        if isinstance(confidence_value, str):
            try:
                confidence_value = float(confidence_value)
            except ValueError:
                confidence_value = 0.5
        elif not isinstance(confidence_value, (int, float)):
            confidence_value = 0.5
        
        # Ensure analysis_details is a clean string (not raw JSON)
        analysis_details_value = analysis_result.get("analysis_details", "")
        if isinstance(analysis_details_value, dict):
            # If it's a dict, convert to string (shouldn't happen, but handle it)
            import json
            analysis_details_value = json.dumps(analysis_details_value)
        elif isinstance(analysis_details_value, str):
            # If analysis_details contains raw JSON (starts with {), extract just the text
            if analysis_details_value.strip().startswith('{'):
                # Try to parse it and extract just the analysis_details field
                try:
                    import json
                    parsed_json = json.loads(analysis_details_value)
                    if isinstance(parsed_json, dict) and "analysis_details" in parsed_json:
                        analysis_details_value = parsed_json["analysis_details"]
                    else:
                        # If it's the full response JSON, create a summary instead
                        risk_factors = parsed_json.get("risk_factors", [])
                        detected = parsed_json.get("detected_allergens", [])
                        if detected:
                            analysis_details_value = f"Potential allergens detected: {', '.join(detected)}."
                        elif risk_factors:
                            analysis_details_value = ". ".join(risk_factors[:2])
                        else:
                            analysis_details_value = "Please review ingredients carefully for potential allergens."
                except:
                    # If parsing fails, use a default message
                    analysis_details_value = "Analysis completed. Please review the detailed results."
        
        # Ensure alternative_suggestions are provided if not safe
        alternative_suggestions = analysis_result.get("alternative_suggestions", [])
        if not is_safe_value and not alternative_suggestions:
            alternative_suggestions = [
                "Ask the restaurant/chef about allergen-free options",
                "Request modifications to remove allergens",
                "Consider preparing a similar dish at home with safe ingredients"
            ]
        
        # Ensure recommendations are provided
        recommendations = analysis_result.get("recommendations", [])
        if not recommendations:
            if not is_safe_value:
                recommendations = [
                    "Avoid this dish or ask about ingredient substitutions",
                    "Check with the chef about preparation methods",
                    "Consider safer alternatives listed below"
                ]
            else:
                recommendations = ["This dish appears safe, but always double-check ingredients when dining out"]
        
        # Convert to AllergenAnalysis model
        allergen_analysis = AllergenAnalysis(
            food_name=food_details.food_name,
            is_safe=is_safe_value,
            risk_level=analysis_result.get("risk_level", "low"),
            detected_allergens=analysis_result.get("detected_allergens", []),
            risk_factors=analysis_result.get("risk_factors", []),
            recommendations=recommendations,
            alternative_suggestions=alternative_suggestions,
            confidence_score=float(confidence_value),
            analysis_details=str(analysis_details_value)
        )
        
        return allergen_analysis
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Allergen analysis failed: {str(e)}")
