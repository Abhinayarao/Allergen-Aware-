from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class AllergenProfile(BaseModel):
    id: Optional[str] = None
    user_id: str
    peanuts: bool = False
    tree_nuts: bool = False
    shellfish: bool = False
    fish: bool = False
    gluten: bool = False
    dairy: bool = False
    eggs: bool = False
    soy: bool = False
    sesame: bool = False
    sulfites: bool = False
    mustard: bool = False
    celery: bool = False
    lupin: bool = False
    mollusks: bool = False
    custom_allergens: Optional[List[str]] = None
    severity_level: Optional[str] = "moderate"  # mild, moderate, severe
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class AllergenProfileUpdate(BaseModel):
    peanuts: Optional[bool] = None
    tree_nuts: Optional[bool] = None
    shellfish: Optional[bool] = None
    fish: Optional[bool] = None
    gluten: Optional[bool] = None
    dairy: Optional[bool] = None
    eggs: Optional[bool] = None
    soy: Optional[bool] = None
    sesame: Optional[bool] = None
    sulfites: Optional[bool] = None
    mustard: Optional[bool] = None
    celery: Optional[bool] = None
    lupin: Optional[bool] = None
    mollusks: Optional[bool] = None
    custom_allergens: Optional[List[str]] = None
    severity_level: Optional[str] = None

class AllergenAnalysis(BaseModel):
    food_name: str
    is_safe: bool
    risk_level: str  # low, medium, high, critical
    detected_allergens: List[str]
    risk_factors: List[str]
    recommendations: List[str]
    alternative_suggestions: List[str]
    confidence_score: float  # 0.0 to 1.0
    analysis_details: str
