import os
import json
from typing import Dict, Any, List
from dotenv import load_dotenv
import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold

load_dotenv()

class GeminiService:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_KEY")
        
        if not self.api_key:
            raise ValueError("GEMINI_KEY must be set in environment variables")
        
        # Configure the Gemini API
        genai.configure(api_key=self.api_key)
        
        # Configure safety settings at model initialization
        # Use BLOCK_ONLY_HIGH since BLOCK_NONE may not be available for all accounts
        safety_settings = [
            {
                "category": "HARM_CATEGORY_HARASSMENT",
                "threshold": "BLOCK_ONLY_HIGH"
            },
            {
                "category": "HARM_CATEGORY_HATE_SPEECH",
                "threshold": "BLOCK_ONLY_HIGH"
            },
            {
                "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                "threshold": "BLOCK_ONLY_HIGH"
            },
            {
                "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
                "threshold": "BLOCK_ONLY_HIGH"
            }
        ]
        
        # Use gemini-2.5-flash as primary model (fast and efficient for text generation)
        # Fallback to gemini-2.5-pro if flash is not available
        try:
            self.model = genai.GenerativeModel(
                'gemini-2.5-flash',
                safety_settings=safety_settings
            )
            print("Initialized Gemini model: gemini-2.5-flash (with safety settings)")
        except Exception as e:
            # Fallback: try gemini-2.5-pro
            print(f"Warning: Failed to initialize gemini-2.5-flash: {e}. Trying gemini-2.5-pro...")
            try:
                self.model = genai.GenerativeModel(
                    'gemini-2.5-pro',
                    safety_settings=safety_settings
                )
                print("Initialized Gemini model: gemini-2.5-pro (with safety settings)")
            except Exception as e2:
                # Fallback: try without safety settings
                print(f"Warning: Failed with safety settings: {e2}. Trying without...")
                try:
                    self.model = genai.GenerativeModel('gemini-2.5-flash')
                    print("Initialized Gemini model: gemini-2.5-flash (without safety settings)")
                except Exception as e3:
                    try:
                        self.model = genai.GenerativeModel('gemini-2.5-pro')
                        print("Initialized Gemini model: gemini-2.5-pro (without safety settings)")
                    except Exception as e4:
                        raise ValueError(f"Failed to initialize any Gemini model. Last error: {e4}")
    
    async def analyze_allergens(self, user_allergens: Dict[str, Any], food_info: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze food for allergen risks using Gemini AI."""
        
        # Prepare the prompt
        prompt = self._create_analysis_prompt(user_allergens, food_info)
        
        try:
            # Use list format for safety settings (more reliable)
            # Safety settings are already configured at model initialization,
            # but we can override them here if needed
            # Using BLOCK_ONLY_HIGH since BLOCK_NONE may not be available
            safety_settings = [
                {
                    "category": "HARM_CATEGORY_HARASSMENT",
                    "threshold": "BLOCK_ONLY_HIGH"
                },
                {
                    "category": "HARM_CATEGORY_HATE_SPEECH",
                    "threshold": "BLOCK_ONLY_HIGH"
                },
                {
                    "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    "threshold": "BLOCK_ONLY_HIGH"
                },
                {
                    "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
                    "threshold": "BLOCK_ONLY_HIGH"
                }
            ]
            
            # Generate content using Gemini
            try:
                response = self.model.generate_content(
                    prompt,
                    generation_config=genai.types.GenerationConfig(
                        temperature=0.1,
                        top_k=32,
                        top_p=1,
                        max_output_tokens=1024,
                    ),
                    safety_settings=safety_settings
                )
            except Exception as api_error:
                # Catch API-level errors (authentication, rate limits, etc.)
                error_details = {
                    "error_type": type(api_error).__name__,
                    "error_message": str(api_error),
                    "error_args": getattr(api_error, 'args', [])
                }
                raise Exception(f"Gemini API call failed: {error_details['error_type']} - {error_details['error_message']}")
            
            # Check for prompt feedback (blocked before generation)
            if hasattr(response, 'prompt_feedback') and response.prompt_feedback:
                if hasattr(response.prompt_feedback, 'block_reason'):
                    block_reason = response.prompt_feedback.block_reason
                    if block_reason and block_reason != 0:  # 0 means not blocked
                        return {
                            "is_safe": False,
                            "risk_level": "medium",
                            "detected_allergens": [],
                            "risk_factors": [f"Prompt blocked: {block_reason}"],
                            "recommendations": ["Please manually review ingredients and consult a healthcare professional"],
                            "alternative_suggestions": [],
                            "confidence_score": 0.3,
                            "analysis_details": "The prompt was blocked by safety filters. Please review ingredients manually for allergens."
                        }
            
            # Check response candidates
            if not response.candidates:
                # Check if there's a prompt feedback indicating why it was blocked
                block_msg = "No candidates in response - may have been blocked"
                if hasattr(response, 'prompt_feedback'):
                    block_msg += f" (prompt feedback: {response.prompt_feedback})"
                raise Exception(block_msg)
            
            candidate = response.candidates[0]
            
            # Try to get text FIRST - sometimes text is available even if finish_reason indicates safety
            text = None
            try:
                text = response.text
            except (ValueError, AttributeError):
                # If response.text fails, try alternative access
                if hasattr(candidate, 'content') and candidate.content:
                    if hasattr(candidate.content, 'parts') and candidate.content.parts:
                        text = candidate.content.parts[0].text
            
            # If we have text, use it regardless of finish_reason
            if text:
                return self._parse_analysis_response(text)
            
            # Only if we don't have text, check finish reason
            finish_reason = getattr(candidate, 'finish_reason', None)
            if finish_reason:
                # Check if it's SAFETY (2) or the enum
                if finish_reason == 2 or (hasattr(genai.types, 'FinishReason') and finish_reason == genai.types.FinishReason.SAFETY):
                    # Get safety ratings if available
                    safety_msg = "Response blocked by safety filters"
                    if hasattr(candidate, 'safety_ratings'):
                        safety_msg += f" (ratings: {candidate.safety_ratings})"
                    
                    return {
                        "is_safe": False,
                        "risk_level": "medium",
                        "detected_allergens": [],
                        "risk_factors": [safety_msg],
                        "recommendations": ["Please manually review ingredients and consult a healthcare professional"],
                        "alternative_suggestions": [],
                        "confidence_score": 0.3,
                        "analysis_details": "The AI analysis was blocked by safety filters. Please review ingredients manually for allergens."
                    }
            
            raise Exception("No valid response from Gemini API - no text content available")
                
        except Exception as e:
            # Log the full error for debugging
            error_msg = str(e)
            error_type = type(e).__name__
            
            # Provide more detailed error information
            detailed_error = f"Gemini API Error ({error_type}): {error_msg}"
            
            # Check if it's a specific Gemini API error
            if "safety" in error_msg.lower() or "blocked" in error_msg.lower():
                return {
                    "is_safe": False,
                    "risk_level": "medium",
                    "detected_allergens": [],
                    "risk_factors": ["Content blocked by safety filters"],
                    "recommendations": ["Please manually review ingredients and consult a healthcare professional"],
                    "alternative_suggestions": [],
                    "confidence_score": 0.3,
                    "analysis_details": f"The AI analysis encountered a safety filter issue: {error_msg}. Please review ingredients manually for allergens."
                }
            
            # For other errors, raise with more context
            raise Exception(f"Failed to analyze allergens: {detailed_error}")
    
    async def analyze_allergens_with_retry(
        self, 
        user_allergens: Dict[str, Any], 
        food_info: Dict[str, Any],
        max_retries: int = 2
    ) -> Dict[str, Any]:
        """
        Analyze allergens with retry logic using simplified prompts if blocked.
        
        Args:
            user_allergens: User's allergen profile
            food_info: Food information with name, ingredients, nutrition
            max_retries: Maximum number of retries with simplified prompts
        
        Returns:
            Analysis result dictionary
        """
        from ..services.prompt_builder import prompt_builder_service
        
        # Build initial prompt using prompt builder
        prompt = prompt_builder_service.build_safe_prompt(user_allergens, food_info, simplified=False)
        
        for attempt in range(max_retries + 1):
            try:
                # Configure safety settings
                safety_settings = [
                    {
                        "category": "HARM_CATEGORY_HARASSMENT",
                        "threshold": "BLOCK_ONLY_HIGH"
                    },
                    {
                        "category": "HARM_CATEGORY_HATE_SPEECH",
                        "threshold": "BLOCK_ONLY_HIGH"
                    },
                    {
                        "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                        "threshold": "BLOCK_ONLY_HIGH"
                    },
                    {
                        "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
                        "threshold": "BLOCK_ONLY_HIGH"
                    }
                ]
                
                # Generate content
                try:
                    response = self.model.generate_content(
                        prompt,
                        generation_config=genai.types.GenerationConfig(
                            temperature=0.1,
                            top_k=32,
                            top_p=1,
                            max_output_tokens=1024,
                        ),
                        safety_settings=safety_settings
                    )
                except Exception as api_error:
                    # If it's not a blocking error, raise it
                    if "blocked" not in str(api_error).lower() and "safety" not in str(api_error).lower():
                        raise
                    
                    # If blocked and we have retries left, try simplified prompt
                    if attempt < max_retries:
                        print(f"Attempt {attempt + 1} API error: {api_error}. Retrying with simplified prompt...")
                        prompt = prompt_builder_service.build_safe_prompt(
                            user_allergens, 
                            food_info, 
                            simplified=True
                        )
                        continue
                    
                    # If all retries exhausted, return blocked response
                    raise
                
                # Check for prompt feedback (blocked before generation)
                if hasattr(response, 'prompt_feedback') and response.prompt_feedback:
                    if hasattr(response.prompt_feedback, 'block_reason'):
                        block_reason = response.prompt_feedback.block_reason
                        if block_reason and block_reason != 0:
                            # If blocked and we have retries left, try simplified prompt
                            if attempt < max_retries:
                                print(f"Attempt {attempt + 1} blocked at prompt level. Retrying with simplified prompt...")
                                prompt = prompt_builder_service.build_safe_prompt(
                                    user_allergens, 
                                    food_info, 
                                    simplified=True
                                )
                                continue
                            
                            # If all retries exhausted, return blocked response
                            return {
                                "is_safe": False,
                                "risk_level": "medium",
                                "detected_allergens": [],
                                "risk_factors": [f"Prompt blocked: {block_reason}"],
                                "recommendations": ["Please manually review ingredients and consult a healthcare professional"],
                                "alternative_suggestions": [],
                                "confidence_score": 0.3,
                                "analysis_details": "The prompt was blocked by safety filters. Please review ingredients manually for allergens."
                            }
                
                # Check response candidates
                if not response.candidates:
                    # If blocked and we have retries left, try simplified prompt
                    if attempt < max_retries:
                        print(f"Attempt {attempt + 1} blocked (no candidates). Retrying with simplified prompt...")
                        prompt = prompt_builder_service.build_safe_prompt(
                            user_allergens, 
                            food_info, 
                            simplified=True
                        )
                        continue
                    
                    raise Exception("No candidates in response - may have been blocked")
                
                candidate = response.candidates[0]
                
                # Try to get text FIRST
                text = None
                try:
                    text = response.text
                except (ValueError, AttributeError):
                    # If response.text fails, try alternative access
                    if hasattr(candidate, 'content') and candidate.content:
                        if hasattr(candidate.content, 'parts') and candidate.content.parts:
                            text = candidate.content.parts[0].text
                
                # If we got text, parse and return
                if text:
                    return self._parse_analysis_response(text)
                
                # If no text, check finish reason
                finish_reason = getattr(candidate, 'finish_reason', None)
                if finish_reason:
                    # Check if it's SAFETY (2) or the enum
                    if finish_reason == 2 or (hasattr(genai.types, 'FinishReason') and finish_reason == genai.types.FinishReason.SAFETY):
                        # If blocked and we have retries left, try simplified prompt
                        if attempt < max_retries:
                            print(f"Attempt {attempt + 1} blocked by safety filters. Retrying with simplified prompt...")
                            prompt = prompt_builder_service.build_safe_prompt(
                                user_allergens, 
                                food_info, 
                                simplified=True
                            )
                            continue
                        
                        # If all retries exhausted, return blocked response
                        safety_msg = "Response blocked by safety filters"
                        if hasattr(candidate, 'safety_ratings'):
                            safety_msg += f" (ratings: {candidate.safety_ratings})"
                        
                        return {
                            "is_safe": False,
                            "risk_level": "medium",
                            "detected_allergens": [],
                            "risk_factors": [safety_msg],
                            "recommendations": ["Please manually review ingredients and consult a healthcare professional"],
                            "alternative_suggestions": [],
                            "confidence_score": 0.3,
                            "analysis_details": "The AI analysis was blocked by safety filters. Please review ingredients manually for allergens."
                        }
                
                # If we get here and no text, raise error
                if attempt < max_retries:
                    print(f"Attempt {attempt + 1} failed (no text). Retrying with simplified prompt...")
                    prompt = prompt_builder_service.build_safe_prompt(
                        user_allergens, 
                        food_info, 
                        simplified=True
                    )
                    continue
                
                raise Exception("No valid response from Gemini API - no text content available")
                
            except Exception as e:
                error_msg = str(e).lower()
                
                # If it's not a blocking error, raise it immediately
                if "blocked" not in error_msg and "safety" not in error_msg:
                    raise Exception(f"Failed to analyze allergens: {e}")
                
                # If blocked and we have retries left, try simplified prompt
                if attempt < max_retries:
                    print(f"Attempt {attempt + 1} blocked: {e}. Retrying with simplified prompt...")
                    prompt = prompt_builder_service.build_safe_prompt(
                        user_allergens, 
                        food_info, 
                        simplified=True
                    )
                    continue
                
                # If all retries exhausted, return blocked response
                return {
                    "is_safe": False,
                    "risk_level": "medium",
                    "detected_allergens": [],
                    "risk_factors": ["Analysis blocked by safety filters after retries"],
                    "recommendations": ["Please manually review ingredients and consult a healthcare professional"],
                    "alternative_suggestions": [],
                    "confidence_score": 0.3,
                    "analysis_details": f"The AI analysis was blocked after {max_retries + 1} attempts. Please review ingredients manually for allergens."
                }
        
        # Should never reach here, but just in case
        raise Exception(f"Failed to analyze allergens after {max_retries + 1} attempts")
    
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
        
        prompt = f"""Explain if this food is safe for someone with allergies. If it's risky, explain the reasons clearly in natural language. Mention specific allergens and any ingredients that could be a concern. Keep it short, clear, and friendly.

The person has these allergies: {', '.join(allergen_list) if allergen_list else 'none'}
Their allergy severity: {user_allergens.get('severity_level', 'moderate')}

Food to check: {food_name}
Ingredients: {', '.join(ingredients) if ingredients else 'Not listed'}
Nutrition info: {json.dumps(nutrition, indent=2) if nutrition else 'Not available'}

IMPORTANT: Respond ONLY in valid JSON format. Do NOT use markdown code blocks (no ```json or ```). Just return the raw JSON object.

{{
    "is_safe": true/false,
    "risk_level": "low/medium/high/critical",
    "detected_allergens": ["list specific allergens found"],
    "risk_factors": ["explain specific concerns in plain English"],
    "recommendations": ["give practical, friendly advice"],
    "alternative_suggestions": ["suggest 2-3 safer alternatives or modifications"],
    "confidence_score": 0.0-1.0,
    "analysis_details": "Write a short, friendly explanation in plain English. If unsafe, mention the specific allergens and ingredients that are a concern. Example: 'This dish contains potential allergens like gluten and celery. These ingredients are commonly found in spice blends and sauces. Please avoid this dish if you're sensitive to these allergens.'"
}}

Guidelines for analysis_details:
- Write naturally, like you're talking to a friend
- Use plain English - avoid medical jargon and code formatting
- If risky: Mention specific allergens (e.g., "gluten", "celery", "dairy") and ingredients that contain them
- Keep it short (2-3 sentences max)
- Be clear and friendly
- If safe: Briefly explain why it's safe

Example good response: "This dish contains potential allergens like gluten and celery. These ingredients are commonly found in spice blends and sauces. Please avoid this dish if you're sensitive to these allergens."

Do NOT include code blocks, markdown formatting, or JSON syntax in the analysis_details text."""
        return prompt
    
    def _parse_analysis_response(self, content: str) -> Dict[str, Any]:
        """Parse the Gemini response into structured data."""
        # Store original content for raw response fallback
        original_content = content
        
        try:
            # Clean the content - remove markdown code blocks if present
            content = content.strip()
            if content.startswith("```json"):
                content = content[7:]  # Remove ```json
            if content.startswith("```"):
                content = content[3:]   # Remove ```
            if content.endswith("```"):
                content = content[:-3]  # Remove closing ```
            content = content.strip()
            
            # Try to extract JSON from the response
            start_idx = content.find('{')
            end_idx = content.rfind('}') + 1
            
            if start_idx != -1 and end_idx != -1:
                json_str = content[start_idx:end_idx]
                parsed = json.loads(json_str)
                
                # Store raw response for fallback display
                parsed["raw_response"] = original_content
                
                # Ensure is_safe is a proper boolean
                if "is_safe" in parsed:
                    if isinstance(parsed["is_safe"], str):
                        parsed["is_safe"] = parsed["is_safe"].lower() in ("true", "1", "yes")
                    elif not isinstance(parsed["is_safe"], bool):
                        parsed["is_safe"] = bool(parsed["is_safe"])
                else:
                    parsed["is_safe"] = True  # Default to safe if missing
                
                # Validate risk_level
                if "risk_level" not in parsed:
                    parsed["risk_level"] = "low"
                
                # Ensure all required fields exist and have proper types
                if "detected_allergens" not in parsed:
                    parsed["detected_allergens"] = []
                elif not isinstance(parsed["detected_allergens"], list):
                    parsed["detected_allergens"] = []
                
                if "risk_factors" not in parsed:
                    parsed["risk_factors"] = []
                elif not isinstance(parsed["risk_factors"], list):
                    parsed["risk_factors"] = []
                
                if "recommendations" not in parsed:
                    parsed["recommendations"] = []
                elif not isinstance(parsed["recommendations"], list):
                    parsed["recommendations"] = []
                
                if "alternative_suggestions" not in parsed:
                    parsed["alternative_suggestions"] = []
                elif not isinstance(parsed["alternative_suggestions"], list):
                    parsed["alternative_suggestions"] = []
                
                # Ensure alternative_suggestions are provided if not safe
                if not parsed.get("is_safe") and not parsed.get("alternative_suggestions"):
                    # Generate default alternatives if missing
                    parsed["alternative_suggestions"] = [
                        "Ask the restaurant/chef about allergen-free options",
                        "Request modifications to remove allergens",
                        "Consider preparing a similar dish at home with safe ingredients"
                    ]
                
                # Ensure recommendations are provided
                if not parsed.get("recommendations"):
                    if not parsed.get("is_safe"):
                        parsed["recommendations"] = [
                            "Avoid this dish or ask about ingredient substitutions",
                            "Check with the chef about preparation methods",
                            "Consider safer alternatives listed below"
                        ]
                    else:
                        parsed["recommendations"] = ["This dish appears safe, but always double-check ingredients when dining out"]
                
                # Ensure analysis_details is a clean string (not the raw JSON or code blocks)
                if "analysis_details" in parsed and parsed["analysis_details"]:
                    # Clean up any code blocks or JSON formatting that might have been included
                    details = str(parsed["analysis_details"])
                    # Remove markdown code blocks if present
                    details = details.replace("```json", "").replace("```", "").strip()
                    # Remove any JSON object syntax that might be in the text
                    if details.startswith("{") and details.endswith("}"):
                        # Try to extract just the text content if it's wrapped in JSON
                        try:
                            temp_parsed = json.loads(details)
                            if "analysis_details" in temp_parsed:
                                details = temp_parsed["analysis_details"]
                        except:
                            pass
                    parsed["analysis_details"] = details
                
                if "analysis_details" not in parsed or not parsed["analysis_details"]:
                    # Create a clean explanation from the parsed data
                    if parsed.get("is_safe"):
                        parsed["analysis_details"] = "This food appears to be safe based on the ingredient analysis."
                    else:
                        risk_factors = parsed.get("risk_factors", [])
                        detected = parsed.get("detected_allergens", [])
                        if detected:
                            parsed["analysis_details"] = f"This dish contains potential allergens like {', '.join(detected)}. Please avoid this dish if you're sensitive to these allergens."
                        elif risk_factors:
                            parsed["analysis_details"] = ". ".join(risk_factors[:2]) + " Please review ingredients carefully."
                        else:
                            parsed["analysis_details"] = "Please review ingredients carefully for potential allergens."
                
                # Remove raw_response from parsed data (don't send to frontend)
                parsed.pop("raw_response", None)
                
                return parsed
            else:
                # Fallback parsing if JSON extraction fails
                return self._fallback_parse(original_content)
        except json.JSONDecodeError as e:
            print(f"JSON parsing error: {e}. Content: {content[:200]}...")
            return self._fallback_parse(original_content)
        except Exception as e:
            print(f"Unexpected parsing error: {e}")
            return self._fallback_parse(original_content)
    
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
        
        # Provide helpful defaults even in fallback
        alternative_suggestions = []
        recommendations = []
        
        if not is_safe:
            alternative_suggestions = [
                "Ask the restaurant/chef about allergen-free options",
                "Request modifications to remove allergens",
                "Consider preparing a similar dish at home with safe ingredients"
            ]
            recommendations = [
                "Avoid this dish or ask about ingredient substitutions",
                "Check with the chef about preparation methods",
                "Consider safer alternatives"
            ]
        else:
            recommendations = ["This dish appears safe, but always double-check ingredients when dining out"]
        
        # Generate natural language explanation
        if not is_safe:
            analysis_details = f"This dish may contain allergens. Please review ingredients carefully and check with the chef about potential allergens before consuming."
        else:
            analysis_details = "This dish appears to be safe based on the available information, but always double-check ingredients when dining out."
        
        # Clean up content if it contains code blocks
        if content:
            content_clean = content.replace("```json", "").replace("```", "").strip()
            if content_clean and not content_clean.startswith("{"):
                analysis_details = content_clean[:200]  # Use first 200 chars if it's readable text
        
        return {
            "is_safe": is_safe,
            "risk_level": risk_level,
            "detected_allergens": [],
            "risk_factors": [],
            "recommendations": recommendations,
            "alternative_suggestions": alternative_suggestions,
            "confidence_score": 0.5,
            "analysis_details": analysis_details
        }

# Create a singleton instance
gemini_service = GeminiService()
