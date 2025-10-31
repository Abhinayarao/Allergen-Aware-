import os
import requests
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv
import json
import time
import hashlib
import hmac
import base64
from urllib.parse import quote, urlencode

load_dotenv()

class FatSecretService:
    def __init__(self):
        self.api_key = os.getenv("FATSECRET_KEY")
        self.api_secret = os.getenv("FATSECRET_SECRET")
        self.base_url = "https://platform.fatsecret.com/rest/server.api"
        
        if not self.api_key or not self.api_secret:
            raise ValueError("FATSECRET_KEY and FATSECRET_SECRET must be set in environment variables")
    
    def _generate_oauth_signature(self, method: str, url: str, params: Dict[str, Any]) -> str:
        """Generate OAuth 1.0 signature for FatSecret API."""
        # Sort parameters
        sorted_params = sorted(params.items())
        param_string = '&'.join([f"{quote(str(k))}={quote(str(v))}" for k, v in sorted_params])
        
        # Create signature base string
        signature_base_string = f"{method}&{quote(url)}&{quote(param_string)}"
        
        # Create signing key
        signing_key = f"{quote(self.api_secret)}&"
        
        # Generate signature
        signature = hmac.new(
            signing_key.encode('utf-8'),
            signature_base_string.encode('utf-8'),
            hashlib.sha1
        ).digest()
        
        return base64.b64encode(signature).decode('utf-8')
    
    def _make_request(self, method: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """Make a request to the FatSecret API with proper OAuth 1.0 signing."""
        # Add OAuth parameters
        oauth_params = {
            'oauth_consumer_key': self.api_key,
            'oauth_nonce': str(int(time.time() * 1000)),
            'oauth_signature_method': 'HMAC-SHA1',
            'oauth_timestamp': str(int(time.time())),
            'oauth_version': '1.0'
        }
        
        # Merge with method parameters
        all_params = {**params, **oauth_params}
        all_params['method'] = method
        all_params['format'] = 'json'
        
        # Generate signature
        signature = self._generate_oauth_signature('GET', self.base_url, all_params)
        all_params['oauth_signature'] = signature
        
        try:
            response = requests.get(self.base_url, params=all_params)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            raise Exception(f"FatSecret API request failed: {e}")
    
    async def search_foods(self, query: str, max_results: int = 10) -> Dict[str, Any]:
        """Search for foods by name."""
        params = {
            'search_expression': query,
            'max_results': max_results,
            'page_number': 0
        }
        
        try:
            result = self._make_request('foods.search', params)
            return result
        except Exception as e:
            raise Exception(f"Food search failed: {e}")
    
    async def get_food_details(self, food_id: str) -> Dict[str, Any]:
        """Get detailed information about a specific food."""
        params = {
            'food_id': food_id
        }
        
        try:
            result = self._make_request('food.get', params)
            return result
        except Exception as e:
            raise Exception(f"Failed to get food details: {e}")
    
    async def search_by_barcode(self, barcode: str) -> Dict[str, Any]:
        """Search for food by barcode."""
        params = {
            'barcode': barcode
        }
        
        try:
            result = self._make_request('food.find_id_for_barcode', params)
            return result
        except Exception as e:
            raise Exception(f"Barcode search failed: {e}")
    
    async def get_food_nutrition(self, food_id: str) -> Dict[str, Any]:
        """Get nutrition information for a specific food."""
        params = {
            'food_id': food_id
        }
        
        try:
            result = self._make_request('food.get.v2', params)
            return result
        except Exception as e:
            raise Exception(f"Failed to get nutrition info: {e}")

# Create a singleton instance
fatsecret_service = FatSecretService()
