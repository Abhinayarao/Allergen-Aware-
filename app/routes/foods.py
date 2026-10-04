import json
from fastapi import APIRouter, HTTPException, Query
from typing import Optional

from ..services.fatsecret import fatsecret_service
from ..models.food import FoodSearchRequest, FoodSearchResponse, FoodItem, FoodDetails

router = APIRouter()

@router.get("/search", response_model=FoodSearchResponse)
async def search_foods(
    query: str = Query(..., description="Food name to search for"),
    max_results: int = Query(10, ge=1, le=50, description="Maximum number of results to return")
):
    """Search for foods by name using FatSecret API."""
    try:
        result = await fatsecret_service.search_foods(query, max_results)

        if "error" in result:
            fallback = _generate_fallback_suggestions(query, max_results)
            return FoodSearchResponse(foods=fallback, total_results=len(fallback), page_number=0, max_results=max_results)

        foods = []
        if "foods" in result and "food" in result["foods"]:
            food_list = result["foods"]["food"]
            if not isinstance(food_list, list):
                food_list = [food_list]

            for food in food_list:
                foods.append(FoodItem(
                    food_id=food.get("food_id", ""),
                    food_name=food.get("food_name", ""),
                    brand_name=food.get("brand_name"),
                    food_type=food.get("food_type"),
                    food_url=food.get("food_url"),
                    food_description=food.get("food_description")
                ))

        if not foods:
            foods = _generate_fallback_suggestions(query, max_results)

        return FoodSearchResponse(foods=foods, total_results=len(foods), page_number=0, max_results=max_results)

    except Exception:
        fallback = _generate_fallback_suggestions(query, max_results)
        return FoodSearchResponse(foods=fallback, total_results=len(fallback), page_number=0, max_results=max_results)


def _generate_fallback_suggestions(query: str, max_results: int) -> list:
    """Generate fallback food suggestions when FatSecret API fails."""
    query_lower = query.lower().strip()

    common_foods = {
        "chicken": ["Chicken Breast", "Chicken Thigh", "Chicken Wings", "Chicken Soup", "Chicken Salad", "Chicken Curry", "Chicken Tikka", "Grilled Chicken"],
        "pizza": ["Margherita Pizza", "Pepperoni Pizza", "Cheese Pizza", "Vegetarian Pizza", "Hawaiian Pizza", "BBQ Chicken Pizza", "Mushroom Pizza", "Supreme Pizza"],
        "pasta": ["Spaghetti", "Penne Pasta", "Fettuccine", "Lasagna", "Macaroni", "Ravioli", "Linguine", "Fusilli"],
        "salad": ["Caesar Salad", "Greek Salad", "Garden Salad", "Chicken Salad", "Fruit Salad", "Coleslaw", "Potato Salad", "Pasta Salad"],
        "soup": ["Chicken Soup", "Tomato Soup", "Vegetable Soup", "Minestrone", "Lentil Soup", "Mushroom Soup", "Corn Soup", "Noodle Soup"],
        "rice": ["White Rice", "Brown Rice", "Fried Rice", "Basmati Rice", "Jasmine Rice", "Risotto", "Rice Pilaf", "Wild Rice"],
        "bread": ["White Bread", "Whole Wheat Bread", "Sourdough Bread", "Rye Bread", "Garlic Bread", "Naan Bread", "Pita Bread", "Baguette"],
        "fish": ["Salmon", "Tuna", "Cod", "Tilapia", "Sardines", "Mackerel", "Trout", "Halibut"],
        "beef": ["Beef Steak", "Ground Beef", "Beef Stew", "Beef Burger", "Beef Roast", "Beef Brisket", "Beef Ribs", "Beef Curry"],
        "pork": ["Pork Chop", "Pork Tenderloin", "Pork Shoulder", "Pork Ribs", "Pork Sausage", "Pork Belly", "Pork Loin", "Pork Stew"],
    }

    suggestions = []
    for key, foods_list in common_foods.items():
        if key in query_lower:
            suggestions = foods_list[:max_results]
            break

    if not suggestions:
        suggestions = [
            f"{query.title()} Recipe",
            f"{query.title()} Dish",
            f"{query.title()} Meal",
            f"{query.title()} Food Item",
        ][:max_results]

    return [
        FoodItem(
            food_id=f"fallback_{idx}",
            food_name=name,
            brand_name=None,
            food_type="Generic",
            food_url=None,
            food_description=f"Food suggestion for {query}"
        )
        for idx, name in enumerate(suggestions[:max_results])
    ]

@router.get("/{food_id}", response_model=FoodDetails)
async def get_food_details(food_id: str):
    """Get detailed information about a specific food."""
    try:
        result = await fatsecret_service.get_food_details(food_id)
        
        # Parse FatSecret response
        food_data = result.get("food", {})
        
        # Extract nutrition information
        nutrition_data = {}
        if "servings" in food_data and "serving" in food_data["servings"]:
            serving = food_data["servings"]["serving"]
            if not isinstance(serving, list):
                serving = [serving]
            
            # Use the first serving for nutrition data
            if serving:
                nutrition_data = {
                    "calories": float(serving[0].get("calories", 0)),
                    "protein": float(serving[0].get("protein", 0)),
                    "carbohydrates": float(serving[0].get("carbohydrate", 0)),
                    "fat": float(serving[0].get("fat", 0)),
                    "fiber": float(serving[0].get("fiber", 0)),
                    "sugar": float(serving[0].get("sugar", 0)),
                    "sodium": float(serving[0].get("sodium", 0)),
                    "cholesterol": float(serving[0].get("cholesterol", 0)),
                    "saturated_fat": float(serving[0].get("saturated_fat", 0)),
                    "serving_size": serving[0].get("serving_size"),
                    "serving_unit": serving[0].get("measurement_description")
                }
        
        # Extract ingredients if available
        ingredients = []
        if "ingredients" in food_data:
            ingredients_text = food_data["ingredients"]
            if ingredients_text:
                # Simple parsing - in production, you'd want more sophisticated parsing
                ingredients = [ingredient.strip() for ingredient in ingredients_text.split(",")]
        
        food_details = FoodDetails(
            food_id=food_data.get("food_id", food_id),
            food_name=food_data.get("food_name", ""),
            brand_name=food_data.get("brand_name"),
            food_type=food_data.get("food_type"),
            food_url=food_data.get("food_url"),
            food_description=food_data.get("food_description"),
            ingredients=ingredients,
            nutrition=nutrition_data,
            allergens=[]  # Would need additional processing to extract allergens
        )
        
        return food_details
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get food details: {str(e)}")

@router.get("/nutrition/{food_id}")
async def get_food_nutrition(food_id: str):
    """Get detailed nutrition information for a specific food."""
    try:
        result = await fatsecret_service.get_food_nutrition(food_id)
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get nutrition info: {str(e)}")
