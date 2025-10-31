from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class FoodSearchRequest(BaseModel):
    query: str
    max_results: Optional[int] = 10

class FoodItem(BaseModel):
    food_id: str
    food_name: str
    brand_name: Optional[str] = None
    food_type: Optional[str] = None
    food_url: Optional[str] = None
    food_description: Optional[str] = None

class NutritionInfo(BaseModel):
    calories: Optional[float] = None
    protein: Optional[float] = None
    carbohydrates: Optional[float] = None
    fat: Optional[float] = None
    fiber: Optional[float] = None
    sugar: Optional[float] = None
    sodium: Optional[float] = None
    cholesterol: Optional[float] = None
    saturated_fat: Optional[float] = None
    trans_fat: Optional[float] = None
    serving_size: Optional[str] = None
    serving_unit: Optional[str] = None

class FoodDetails(BaseModel):
    food_id: str
    food_name: str
    brand_name: Optional[str] = None
    food_type: Optional[str] = None
    food_url: Optional[str] = None
    food_description: Optional[str] = None
    ingredients: Optional[List[str]] = None
    nutrition: Optional[NutritionInfo] = None
    allergens: Optional[List[str]] = None
    barcode: Optional[str] = None

class FoodSearchResponse(BaseModel):
    foods: List[FoodItem]
    total_results: int
    page_number: int
    max_results: int

class BarcodeScanRequest(BaseModel):
    barcode: str

class VoiceInputRequest(BaseModel):
    text: Optional[str] = None
    audio_base64: Optional[str] = None

class ScanResponse(BaseModel):
    success: bool
    food_details: Optional[FoodDetails] = None
    error_message: Optional[str] = None
