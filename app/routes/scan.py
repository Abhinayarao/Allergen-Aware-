import base64
import hashlib
import io
import json
import os
from typing import Optional

from fastapi import APIRouter, HTTPException, UploadFile, File, Depends, Form
import google.generativeai as genai
from PIL import Image

from ..services.fatsecret import fatsecret_service
from ..services.gemini import gemini_service
from ..firebase import get_firestore_client
from ..models.food import ScanResponse, FoodDetails, BarcodeScanRequest, VoiceInputRequest, NutritionInfo
from ..models.allergen import AllergenAnalysis
from ..dependencies import get_current_user_id
from ..utils.helpers import validate_image_file
from ..services.prompt_builder import prompt_builder_service

router = APIRouter()

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
        image_data = await file.read()

        if not validate_image_file(image_data):
            return ScanResponse(
                success=False,
                food_details=None,
                error_message="Invalid image file"
            )

        api_key = os.getenv("GEMINI_KEY")
        if not api_key:
            raise ValueError("GEMINI_KEY must be set in environment variables")

        genai.configure(api_key=api_key)
        vision_model = genai.GenerativeModel('gemini-2.5-flash')

        image = Image.open(io.BytesIO(image_data))

        vision_prompt = """Analyze this food image and provide the following information in JSON format:

1. food_name: The name of the dish/food item (be specific, e.g., "Chicken Tikka Masala" not just "food")
2. ingredients: A list of visible or likely ingredients based on what you can see (be comprehensive)
3. description: A brief description of what you see

Respond ONLY with valid JSON in this exact format (no markdown, no code blocks):
{
    "food_name": "specific dish name",
    "ingredients": ["ingredient1", "ingredient2", "ingredient3"],
    "description": "brief description"
}"""

        try:
            response = vision_model.generate_content(
                [vision_prompt, image],
                generation_config=genai.types.GenerationConfig(
                    temperature=0.3,
                    top_k=32,
                    top_p=1,
                    max_output_tokens=1024,
                )
            )

            response_text = response.text.strip()

            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.startswith("```"):
                response_text = response_text[3:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            response_text = response_text.strip()

            start_idx = response_text.find('{')
            end_idx = response_text.rfind('}') + 1

            if start_idx != -1 and end_idx > start_idx:
                vision_result = json.loads(response_text[start_idx:end_idx])
            else:
                raise ValueError("No JSON found in response")

            food_name = vision_result.get("food_name", "Unknown Food Item")
            ingredients = vision_result.get("ingredients", [])
            description = vision_result.get("description", "")

            if not ingredients or food_name.lower() in ["unknown food item", "food", "dish", "unknown"]:
                enriched_info = await prompt_builder_service.enrich_food_with_ingredients(food_name)
                if enriched_info.get("ingredients"):
                    ingredients = enriched_info["ingredients"]
                if enriched_info.get("food_name") and food_name.lower() in ["unknown food item", "food", "dish", "unknown"]:
                    food_name = enriched_info["food_name"]

            food_details = FoodDetails(
                food_id=f"image_scan_{hashlib.md5(food_name.encode()).hexdigest()[:8]}",
                food_name=food_name,
                ingredients=ingredients if ingredients else [],
                nutrition=None,
                food_description=description
            )

            return ScanResponse(
                success=True,
                food_details=food_details,
                error_message=None
            )

        except Exception as vision_error:
            import traceback
            traceback.print_exc()
            return ScanResponse(
                success=False,
                food_details=None,
                error_message=f"Failed to analyze image: {str(vision_error)}"
            )

    except Exception as e:
        import traceback
        traceback.print_exc()
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

        if voice_data.audio_base64 and not text:
            mime_type = voice_data.audio_mime_type or "audio/mp4"
            text = await gemini_service.transcribe_audio(voice_data.audio_base64, mime_type)

        if not text:
            return ScanResponse(
                success=False,
                food_details=None,
                error_message="No text or audio provided"
            )
        
        # Search for food using the transcribed text
        search_result = await fatsecret_service.search_foods(text, max_results=1)
        
        if "foods" not in search_result or "food" not in search_result.get("foods", {}):
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
        user_allergens = await get_user_allergens(user_id)

        if not food_details.ingredients:
            enriched_info = await prompt_builder_service.enrich_food_with_ingredients(food_details.food_name)
            food_details.ingredients = enriched_info.get("ingredients", [])
            if not food_details.nutrition and enriched_info.get("nutrition"):
                food_details.nutrition = NutritionInfo(**enriched_info["nutrition"])

        food_info = {
            "food_name": food_details.food_name,
            "ingredients": food_details.ingredients or [],
            "nutrition": food_details.nutrition.dict() if food_details.nutrition else {}
        }

        vague_detected = prompt_builder_service.has_vague_ingredients(food_details.ingredients or [])
        analysis_result = await gemini_service.analyze_allergens_with_retry(user_allergens, food_info)

        is_safe_value = analysis_result.get("is_safe", True)
        if isinstance(is_safe_value, str):
            is_safe_value = is_safe_value.lower() in ("true", "1", "yes")
        elif not isinstance(is_safe_value, bool):
            is_safe_value = bool(is_safe_value)

        confidence_value = analysis_result.get("confidence_score", 0.5)
        if isinstance(confidence_value, str):
            try:
                confidence_value = float(confidence_value)
            except ValueError:
                confidence_value = 0.5
        elif not isinstance(confidence_value, (int, float)):
            confidence_value = 0.5

        analysis_details_value = analysis_result.get("analysis_details", "")
        if isinstance(analysis_details_value, dict):
            analysis_details_value = json.dumps(analysis_details_value)
        elif isinstance(analysis_details_value, str) and analysis_details_value.strip().startswith('{'):
            try:
                parsed_json = json.loads(analysis_details_value)
                if isinstance(parsed_json, dict) and "analysis_details" in parsed_json:
                    analysis_details_value = parsed_json["analysis_details"]
                else:
                    detected = parsed_json.get("detected_allergens", [])
                    risk_factors = parsed_json.get("risk_factors", [])
                    if detected:
                        analysis_details_value = f"Potential allergens detected: {', '.join(detected)}."
                    elif risk_factors:
                        analysis_details_value = ". ".join(risk_factors[:2])
                    else:
                        analysis_details_value = "Please review ingredients carefully for potential allergens."
            except Exception:
                analysis_details_value = "Analysis completed. Please review the detailed results."

        alternative_suggestions = analysis_result.get("alternative_suggestions", [])
        if not is_safe_value and not alternative_suggestions:
            alternative_suggestions = [
                "Ask the restaurant/chef about allergen-free options",
                "Request modifications to remove allergens",
                "Consider preparing a similar dish at home with safe ingredients"
            ]

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

        risk_level = analysis_result.get("risk_level", "low")
        # Upgrade risk_level to uncertain if vague ingredients were detected and Gemini didn't already flag it
        if vague_detected and risk_level not in ("uncertain", "high", "critical"):
            risk_level = "uncertain"

        nutrition_out = None
        if food_details.nutrition:
            n = food_details.nutrition
            nutrition_out = {
                "calories": n.calories or 0,
                "protein": n.protein or 0,
                "carbs": n.carbohydrates or 0,
                "fat": n.fat or 0,
            }

        return AllergenAnalysis(
            food_name=food_details.food_name,
            is_safe=is_safe_value,
            risk_level=risk_level,
            detected_allergens=analysis_result.get("detected_allergens", []),
            risk_factors=analysis_result.get("risk_factors", []),
            recommendations=recommendations,
            alternative_suggestions=alternative_suggestions,
            confidence_score=float(confidence_value),
            analysis_details=str(analysis_details_value),
            ingredients=food_details.ingredients or [],
            nutrition=nutrition_out,
            vague_ingredients_detected=vague_detected,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Allergen analysis failed: {str(e)}")
