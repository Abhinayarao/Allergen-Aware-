import os
import json
from typing import Dict, Any, List
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

class GeminiService:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_KEY")
        
        if not self.api_key:
            raise ValueError("GEMINI_KEY must be set in environment variables")
        
        # Configure the Gemini API
        genai.configure(api_key=self.api_key)
        self.model = genai.GenerativeModel('gemini-pro')
    
    async def analyze_allergens(self, user_allergens: Dict[str, Any], food_info: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze food for allergen risks using Gemini AI."""
        
        # Prepare the prompt
        prompt = self._create_analysis_prompt(user_allergens, food_info)
        
        try:
            # Generate content using Gemini
            response = self.model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.1,
                    top_k=32,
                    top_p=1,
                    max_output_tokens=1024,
                )
            )
            
            if response.text:
                return self._parse_analysis_response(response.text)
            else:
                raise Exception("No valid response from Gemini API")
                
        except Exception as e:
            raise Exception(f"Failed to analyze allergens: {e}")
    
    def _create_analysis_prompt(self, user_allergens: Dict[str, Any], food_info: Dict[str, Any]) -> str:
        """Create a detailed prompt for allergen analysis."""
        
        # Extract user allergens
        allergen_list = []
        for allergen, has_allergy in user_allergens.items():
            if has_allergy and allergen != "custom_allergens" and allergen != "severity_level":
                allergen_list.append(allergen.replace("_", " "))
        
        if user_allergens.get("custom_allergens"):
            allergen_list.extend(user_allergens["custom_allergens"])
        
        # Extract food information
        food_name = food_info.get("food_name", "Unknown food")
        ingredients = food_info.get("ingredients", [])
        nutrition = food_info.get("nutrition", {})
        
        prompt = f"""
You are an expert food allergen analyst. Analyze the following food for potential allergen risks for a user with specific allergies.

USER ALLERGIES: {', '.join(allergen_list) if allergen_list else 'None specified'}
SEVERITY LEVEL: {user_allergens.get('severity_level', 'moderate')}

FOOD INFORMATION:
- Name: {food_name}
- Ingredients: {', '.join(ingredients) if ingredients else 'Not specified'}
- Nutrition: {json.dumps(nutrition, indent=2) if nutrition else 'Not available'}

Please provide a comprehensive allergen analysis in the following JSON format:
{{
    "is_safe": true/false,
    "risk_level": "low/medium/high/critical",
    "detected_allergens": ["list of allergens found"],
    "risk_factors": ["specific risk factors identified"],
    "recommendations": ["specific recommendations for the user"],
    "alternative_suggestions": ["safer alternative foods"],
    "confidence_score": 0.0-1.0,
    "analysis_details": "detailed explanation of the analysis"
}}

Consider:
1. Direct allergen presence in ingredients
2. Cross-contamination risks
3. Hidden allergens in processed foods
4. Severity of the user's allergies
5. Manufacturing processes that might introduce allergens
6. Alternative ingredients or preparation methods

Be thorough but concise. Prioritize user safety.
"""
        return prompt
    
    def _parse_analysis_response(self, content: str) -> Dict[str, Any]:
        """Parse the Gemini response into structured data."""
        try:
            # Try to extract JSON from the response
            start_idx = content.find('{')
            end_idx = content.rfind('}') + 1
            
            if start_idx != -1 and end_idx != -1:
                json_str = content[start_idx:end_idx]
                return json.loads(json_str)
            else:
                # Fallback parsing if JSON extraction fails
                return self._fallback_parse(content)
        except json.JSONDecodeError:
            return self._fallback_parse(content)
    
    def _fallback_parse(self, content: str) -> Dict[str, Any]:
        """Fallback parsing when JSON extraction fails."""
        # Basic keyword-based parsing as fallback
        content_lower = content.lower()
        
        is_safe = "unsafe" not in content_lower and "dangerous" not in content_lower
        risk_level = "low"
        
        if "critical" in content_lower or "severe" in content_lower:
            risk_level = "critical"
        elif "high" in content_lower:
            risk_level = "high"
        elif "medium" in content_lower:
            risk_level = "medium"
        
        return {
            "is_safe": is_safe,
            "risk_level": risk_level,
            "detected_allergens": [],
            "risk_factors": ["Unable to parse detailed analysis"],
            "recommendations": ["Please review ingredients manually"],
            "alternative_suggestions": [],
            "confidence_score": 0.5,
            "analysis_details": content
        }

# Create a singleton instance
gemini_service = GeminiService()
