"""
Utility functions for the Allergen-Aware Recipe Advisor API.
"""
import base64
import io
import re
from typing import List, Dict, Any, Optional
from PIL import Image
import aiofiles
import os
from datetime import datetime


def decode_base64_audio(audio_base64: str) -> bytes:
    """
    Decode base64 encoded audio data.
    
    Args:
        audio_base64: Base64 encoded audio string
        
    Returns:
        Decoded audio bytes
    """
    try:
        # Remove data URL prefix if present
        if audio_base64.startswith('data:audio'):
            audio_base64 = audio_base64.split(',')[1]
        
        return base64.b64decode(audio_base64)
    except Exception as e:
        raise ValueError(f"Failed to decode base64 audio: {e}")


def validate_image_file(file_content: bytes) -> bool:
    """
    Validate that the uploaded file is a valid image.
    
    Args:
        file_content: Raw file content as bytes
        
    Returns:
        True if valid image, False otherwise
    """
    try:
        image = Image.open(io.BytesIO(file_content))
        image.verify()
        return True
    except Exception:
        return False


def extract_ingredients_from_text(text: str) -> List[str]:
    """
    Extract ingredients from a text string.
    
    Args:
        text: Text containing ingredients
        
    Returns:
        List of extracted ingredients
    """
    if not text:
        return []
    
    # Common ingredient separators
    separators = [',', ';', '\n', '|', '•']
    
    ingredients = []
    for separator in separators:
        if separator in text:
            ingredients = [ingredient.strip() for ingredient in text.split(separator)]
            break
    
    if not ingredients:
        ingredients = [text.strip()]
    
    # Clean up ingredients
    cleaned_ingredients = []
    for ingredient in ingredients:
        ingredient = ingredient.strip()
        if ingredient and len(ingredient) > 1:
            # Remove common prefixes
            ingredient = re.sub(r'^[-•\*\d+\.\)\s]+', '', ingredient)
            cleaned_ingredients.append(ingredient)
    
    return cleaned_ingredients


def parse_nutrition_data(nutrition_text: str) -> Dict[str, float]:
    """
    Parse nutrition information from text.
    
    Args:
        nutrition_text: Text containing nutrition information
        
    Returns:
        Dictionary of nutrition values
    """
    nutrition = {}
    
    if not nutrition_text:
        return nutrition
    
    # Common nutrition patterns
    patterns = {
        'calories': r'(\d+(?:\.\d+)?)\s*(?:cal|kcal|calories)',
        'protein': r'(\d+(?:\.\d+)?)\s*(?:g|grams?)\s*(?:protein)',
        'carbs': r'(\d+(?:\.\d+)?)\s*(?:g|grams?)\s*(?:carbs|carbohydrates)',
        'fat': r'(\d+(?:\.\d+)?)\s*(?:g|grams?)\s*(?:fat)',
        'fiber': r'(\d+(?:\.\d+)?)\s*(?:g|grams?)\s*(?:fiber)',
        'sugar': r'(\d+(?:\.\d+)?)\s*(?:g|grams?)\s*(?:sugar)',
        'sodium': r'(\d+(?:\.\d+)?)\s*(?:mg|milligrams?)\s*(?:sodium)',
    }
    
    for key, pattern in patterns.items():
        match = re.search(pattern, nutrition_text.lower())
        if match:
            nutrition[key] = float(match.group(1))
    
    return nutrition


def format_allergen_list(allergens: List[str]) -> str:
    """
    Format a list of allergens into a readable string.
    
    Args:
        allergens: List of allergen names
        
    Returns:
        Formatted allergen string
    """
    if not allergens:
        return "None detected"
    
    if len(allergens) == 1:
        return allergens[0]
    
    if len(allergens) == 2:
        return f"{allergens[0]} and {allergens[1]}"
    
    return f"{', '.join(allergens[:-1])}, and {allergens[-1]}"


def calculate_risk_score(detected_allergens: List[str], user_allergens: Dict[str, Any]) -> float:
    """
    Calculate a risk score based on detected allergens and user profile.
    
    Args:
        detected_allergens: List of allergens found in food
        user_allergens: User's allergen profile
        
    Returns:
        Risk score between 0.0 and 1.0
    """
    if not detected_allergens:
        return 0.0
    
    # Get user's allergens
    user_allergen_list = []
    for allergen, has_allergy in user_allergens.items():
        if has_allergy and allergen not in ['custom_allergens', 'severity_level']:
            user_allergen_list.append(allergen.replace('_', ' '))
    
    if user_allergens.get('custom_allergens'):
        user_allergen_list.extend(user_allergens['custom_allergens'])
    
    # Calculate matches
    matches = 0
    for detected in detected_allergens:
        for user_allergen in user_allergen_list:
            if user_allergen.lower() in detected.lower() or detected.lower() in user_allergen.lower():
                matches += 1
                break
    
    # Base risk score
    risk_score = matches / len(detected_allergens) if detected_allergens else 0.0
    
    # Adjust based on severity level
    severity = user_allergens.get('severity_level', 'moderate')
    if severity == 'severe':
        risk_score = min(1.0, risk_score * 1.2)
    elif severity == 'mild':
        risk_score = max(0.0, risk_score * 0.8)
    
    return min(1.0, risk_score)


def generate_food_id(food_name: str, brand: Optional[str] = None) -> str:
    """
    Generate a unique food ID based on food name and brand.
    
    Args:
        food_name: Name of the food
        brand: Brand name (optional)
        
    Returns:
        Generated food ID
    """
    import hashlib
    
    # Create a unique identifier
    identifier = food_name.lower().replace(' ', '_')
    if brand:
        identifier += f"_{brand.lower().replace(' ', '_')}"
    
    # Generate hash
    hash_object = hashlib.md5(identifier.encode())
    return f"food_{hash_object.hexdigest()[:8]}"


async def save_scan_to_history(
    user_id: str,
    scan_type: str,
    food_data: Dict[str, Any],
    analysis_result: Optional[Dict[str, Any]] = None
) -> str:
    """
    Save a scan to the user's scan history.
    
    Args:
        user_id: User ID
        scan_type: Type of scan (image, barcode, voice)
        food_data: Food information
        analysis_result: AI analysis result
        
    Returns:
        Scan ID
    """
    from ..auth import get_supabase_client
    
    supabase = get_supabase_client()
    
    scan_data = {
        'user_id': user_id,
        'scan_type': scan_type,
        'food_id': food_data.get('food_id'),
        'food_name': food_data.get('food_name', 'Unknown'),
        'scan_data': food_data,
        'analysis_result': analysis_result,
        'created_at': datetime.utcnow().isoformat()
    }
    
    try:
        response = supabase.table('food_scans').insert(scan_data).execute()
        return response.data[0]['id']
    except Exception as e:
        print(f"Failed to save scan history: {e}")
        return ""


def format_confidence_score(score: float) -> str:
    """
    Format confidence score into a human-readable string.
    
    Args:
        score: Confidence score between 0.0 and 1.0
        
    Returns:
        Formatted confidence string
    """
    if score >= 0.9:
        return "Very High"
    elif score >= 0.7:
        return "High"
    elif score >= 0.5:
        return "Medium"
    elif score >= 0.3:
        return "Low"
    else:
        return "Very Low"


def sanitize_food_name(name: str) -> str:
    """
    Sanitize food name for consistent processing.
    
    Args:
        name: Raw food name
        
    Returns:
        Sanitized food name
    """
    if not name:
        return "Unknown Food"
    
    # Remove extra whitespace
    name = re.sub(r'\s+', ' ', name.strip())
    
    # Remove common prefixes/suffixes
    name = re.sub(r'^(the|a|an)\s+', '', name, flags=re.IGNORECASE)
    name = re.sub(r'\s+(brand|product|item)$', '', name, flags=re.IGNORECASE)
    
    return name.title()


def extract_barcode_from_text(text: str) -> Optional[str]:
    """
    Extract barcode from text input.
    
    Args:
        text: Text that might contain a barcode
        
    Returns:
        Extracted barcode or None
    """
    # Common barcode patterns
    patterns = [
        r'\b\d{8,14}\b',  # 8-14 digit barcodes
        r'\b\d{12}\b',    # UPC-12
        r'\b\d{13}\b',    # EAN-13
        r'\b\d{14}\b',    # ITF-14
    ]
    
    for pattern in patterns:
        matches = re.findall(pattern, text)
        if matches:
            return matches[0]
    
    return None


def validate_barcode(barcode: str) -> bool:
    """
    Validate barcode format.
    
    Args:
        barcode: Barcode string to validate
        
    Returns:
        True if valid barcode format
    """
    if not barcode:
        return False
    
    # Remove any non-digit characters
    clean_barcode = re.sub(r'\D', '', barcode)
    
    # Check length (8-14 digits)
    if len(clean_barcode) < 8 or len(clean_barcode) > 14:
        return False
    
    # Check if all digits
    return clean_barcode.isdigit()
