import os
from typing import Dict, Any, List, Optional
from ..services.fatsecret import fatsecret_service

class PromptBuilderService:
    """Service to build safe and structured prompts for Gemini AI."""

    VAGUE_TERMS = [
        "natural flavoring", "natural flavors", "natural flavor",
        "artificial flavors", "artificial flavoring", "artificial flavor",
        "spices", "seasoning", "flavorings", "natural and artificial",
        "may contain", "traces of", "processed in a facility",
        "derived from", "hydrolyzed", "extract", "concentrate",
        "modified starch", "modified food starch",
    ]

    def has_vague_ingredients(self, ingredients: List[str]) -> bool:
        text = " ".join(ingredients).lower()
        return any(term in text for term in self.VAGUE_TERMS)

    # Static mappings for common dishes (fallback if FatSecret doesn't have ingredients)
    COMMON_DISH_INGREDIENTS = {
        "butter chicken": ["chicken", "butter", "tomato", "cream", "onion", "garlic", "ginger", "spices", "yogurt"],
        "chicken tikka masala": ["chicken", "yogurt", "tomato", "cream", "onion", "garlic", "ginger", "spices"],
        "tikka masala": ["chicken", "yogurt", "tomato", "cream", "onion", "garlic", "ginger", "spices"],
        "chicken saag": ["chicken", "spinach", "onion", "garlic", "ginger", "tomato", "spices", "oil", "cream"],
        "saag": ["spinach", "onion", "garlic", "ginger", "tomato", "spices", "oil"],
        "naan": ["flour", "yeast", "yogurt", "milk", "butter", "salt", "sugar"],
        "garlic naan": ["flour", "yeast", "yogurt", "milk", "butter", "garlic", "salt", "sugar"],
        "chicken curry": ["chicken", "onion", "tomato", "coconut milk", "spices", "oil"],
        "pasta": ["flour", "eggs", "water", "salt"],
        "pizza": ["flour", "yeast", "tomato", "cheese", "oil"],
    }
    
    async def enrich_food_with_ingredients(self, food_name: str) -> Dict[str, Any]:
        """
        Enrich food name with ingredients from FatSecret or static mappings.
        
        Args:
            food_name: Name of the food item (e.g., "butter chicken with naan")
        
        Returns:
            Dict with food_name, ingredients list, and nutrition info
        """
        ingredients = []
        nutrition = {}
        
        # Try to get ingredients from FatSecret
        try:
            # Search for the food
            search_results = await fatsecret_service.search_foods(food_name, max_results=3)
            
            if search_results.get("foods") and search_results["foods"].get("food"):
                food_list = search_results["foods"]["food"]
                if not isinstance(food_list, list):
                    food_list = [food_list]
                
                # Try to get ingredients from the best match
                for food_item in food_list:
                    food_id = food_item.get("food_id")
                    
                    if food_id:
                        try:
                            # Get detailed food information
                            food_details = await fatsecret_service.get_food_details(food_id)
                            food_data = food_details.get("food", {})
                            
                            # Extract ingredients
                            if "ingredients" in food_data and food_data["ingredients"]:
                                ingredients_text = food_data["ingredients"]
                                ingredients = [ing.strip() for ing in ingredients_text.split(",") if ing.strip()]
                            
                            # Extract nutrition if available
                            if "servings" in food_data and "serving" in food_data["servings"]:
                                serving = food_data["servings"]["serving"]
                                if not isinstance(serving, list):
                                    serving = [serving]
                                if serving:
                                    nutrition = {
                                        "calories": float(serving[0].get("calories", 0)),
                                        "protein": float(serving[0].get("protein", 0)),
                                        "carbohydrates": float(serving[0].get("carbohydrate", 0)),
                                        "fat": float(serving[0].get("fat", 0)),
                                    }
                            
                            # If we found ingredients, break
                            if ingredients:
                                break
                        except Exception as e:
                            # Continue to next food item if this one fails
                            continue
        except Exception as e:
            print(f"FatSecret lookup failed: {e}. Using static mappings...")
        
        # Fallback to static mappings if no ingredients found
        if not ingredients:
            food_lower = food_name.lower()
            # Check for multiple dishes (e.g., "butter chicken with naan")
            combined_ingredients = []
            
            for dish_name, dish_ingredients in self.COMMON_DISH_INGREDIENTS.items():
                if dish_name in food_lower:
                    # Add ingredients, avoiding duplicates
                    for ing in dish_ingredients:
                        if ing not in combined_ingredients:
                            combined_ingredients.append(ing)
            
            if combined_ingredients:
                ingredients = combined_ingredients
        
        return {
            "food_name": food_name,
            "ingredients": ingredients,
            "nutrition": nutrition
        }
    
    def build_safe_prompt(self, user_allergens: Dict[str, Any], food_info: Dict[str, Any], simplified: bool = False) -> str:
        """
        Build a safe, structured prompt for Gemini.
        
        Args:
            user_allergens: User's allergen profile
            food_info: Food information with name, ingredients, nutrition
            simplified: If True, creates a simpler prompt to avoid safety filters
        
        Returns:
            Formatted prompt string
        """
        # Extract user allergens - filter out non-allergen fields
        allergen_list = []
        # List of fields to exclude (not allergens)
        excluded_fields = {
            "custom_allergens", "severity_level", "created_at", "updated_at", 
            "user_id", "id", "created", "updated"
        }
        
        for allergen, has_allergy in user_allergens.items():
            # Only include boolean fields that are True and not in excluded list
            if (has_allergy and 
                allergen not in excluded_fields and 
                isinstance(has_allergy, bool)):
                allergen_list.append(allergen.replace("_", " "))
        
        if user_allergens.get("custom_allergens"):
            allergen_list.extend(user_allergens["custom_allergens"])
        
        food_name = food_info.get("food_name", "Unknown food")
        ingredients = food_info.get("ingredients", [])
        nutrition = food_info.get("nutrition", {})
        vague = self.has_vague_ingredients(ingredients)
        vague_note = (
            '\nNOTE: This food contains vague ingredient terms (e.g., "natural flavoring", "spices", "may contain"). '
            'Set risk_level to "uncertain" and start analysis_details with "Uncertain — verify manually." '
            'because hidden allergens cannot be confirmed from vague labels.'
        ) if vague else ""

        if simplified:
            prompt = f"""Explain if this food is safe for someone with allergies. If it's risky, explain the reasons clearly in natural language. Mention specific allergens and ingredients that could be a concern. Keep it short, clear, and friendly.
{vague_note}
Food: {food_name}
Ingredients: {', '.join(ingredients) if ingredients else 'not listed'}
Allergies to check: {', '.join(allergen_list) if allergen_list else 'none'}

IMPORTANT: Respond ONLY in valid JSON format. Do NOT use markdown code blocks (no ```json or ```). Just return the raw JSON object.

{{
    "is_safe": true/false,
    "risk_level": "low/medium/high/uncertain",
    "detected_allergens": [],
    "risk_factors": [],
    "recommendations": [],
    "alternative_suggestions": [],
    "confidence_score": 0.0-1.0,
    "analysis_details": "Write a short, friendly explanation. If vague ingredients exist, start with: Uncertain — verify manually. If unsafe, mention specific allergens."
}}

If the food is NOT safe, suggest at least 2-3 alternative dishes in alternative_suggestions. Do NOT include code blocks or JSON in analysis_details."""
        else:
            prompt = f"""Explain if this food is safe for someone with allergies. If it's risky, explain the reasons clearly in natural language. Mention specific allergens and any ingredients that could be a concern. Keep it short, clear, and friendly.
{vague_note}
The person has these allergies: {', '.join(allergen_list) if allergen_list else 'none'}
Their allergy severity: {user_allergens.get('severity_level', 'moderate')}

Food to check: {food_name}
Ingredients: {', '.join(ingredients) if ingredients else 'Not listed'}
Nutrition info: {nutrition if nutrition else 'Not available'}

IMPORTANT: Respond ONLY in valid JSON format. Do NOT use markdown code blocks (no ```json or ```). Just return the raw JSON object.

{{
    "is_safe": true/false,
    "risk_level": "low/medium/high/critical/uncertain",
    "detected_allergens": ["list specific allergens found"],
    "risk_factors": ["explain specific concerns in plain English"],
    "recommendations": ["give practical, friendly advice"],
    "alternative_suggestions": ["suggest 2-3 safer alternatives or modifications"],
    "confidence_score": 0.0-1.0,
    "analysis_details": "Write a short, friendly explanation in plain English. If vague ingredients exist, start with: Uncertain — verify manually. If unsafe, mention the specific allergens and ingredients."
}}

Guidelines for analysis_details:
- Write naturally, like you're talking to a friend
- If vague ingredients detected: Start with "Uncertain — verify manually." then explain why
- If risky: Mention specific allergens (e.g., "gluten", "dairy") and which ingredients contain them
- Keep it short (2-3 sentences max)
- If safe: Briefly explain why it's safe

Do NOT include code blocks, markdown formatting, or JSON syntax in the analysis_details text."""
        
        return prompt

# Create singleton instance
prompt_builder_service = PromptBuilderService()

