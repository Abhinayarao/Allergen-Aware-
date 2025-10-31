"""
Test setup and configuration for the Allergen-Aware Recipe Advisor API.
"""
import pytest
import asyncio
from fastapi.testclient import TestClient
from app.main import app
from app.auth import get_supabase_client
from app.services.fatsecret import FatSecretService
from app.services.gemini import GeminiService


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
def client():
    """Create a test client for the FastAPI application."""
    return TestClient(app)


@pytest.fixture
def mock_supabase():
    """Mock Supabase client for testing."""
    class MockSupabase:
        def __init__(self):
            self.auth = MockAuth()
            self.table = lambda name: MockTable()
    
    class MockAuth:
        def sign_up(self, **kwargs):
            return MockResponse(user=MockUser())
        
        def sign_in_with_password(self, **kwargs):
            return MockResponse(
                user=MockUser(),
                session=MockSession()
            )
        
        def sign_out(self):
            return {"message": "Signed out"}
    
    class MockUser:
        def __init__(self):
            self.id = "test-user-id"
            self.email = "test@example.com"
    
    class MockSession:
        def __init__(self):
            self.access_token = "test-access-token"
            self.refresh_token = "test-refresh-token"
    
    class MockResponse:
        def __init__(self, **kwargs):
            for key, value in kwargs.items():
                setattr(self, key, value)
    
    class MockTable:
        def select(self, *args):
            return self
        
        def eq(self, *args):
            return self
        
        def insert(self, data):
            return MockResponse(data=[data])
        
        def update(self, data):
            return MockResponse(data=[data])
        
        def execute(self):
            return MockResponse(data=[])
    
    return MockSupabase()


@pytest.fixture
def mock_fatsecret():
    """Mock FatSecret service for testing."""
    class MockFatSecret:
        async def search_foods(self, query, max_results=10):
            return {
                "foods": {
                    "food": [
                        {
                            "food_id": "12345",
                            "food_name": "Test Food",
                            "brand_name": "Test Brand",
                            "food_type": "Generic",
                            "food_url": "https://example.com",
                            "food_description": "A test food item"
                        }
                    ]
                }
            }
        
        async def get_food_details(self, food_id):
            return {
                "food": {
                    "food_id": food_id,
                    "food_name": "Test Food",
                    "brand_name": "Test Brand",
                    "ingredients": "wheat flour, eggs, milk",
                    "servings": {
                        "serving": [
                            {
                                "calories": "250",
                                "protein": "8.5",
                                "carbohydrate": "35.2",
                                "fat": "9.1"
                            }
                        ]
                    }
                }
            }
        
        async def search_by_barcode(self, barcode):
            return {
                "food_id": "12345",
                "food_name": "Test Food"
            }
    
    return MockFatSecret()


@pytest.fixture
def mock_gemini():
    """Mock Gemini service for testing."""
    class MockGemini:
        async def analyze_allergens(self, user_allergens, food_info):
            return {
                "is_safe": True,
                "risk_level": "low",
                "detected_allergens": [],
                "risk_factors": [],
                "recommendations": ["Safe to consume"],
                "alternative_suggestions": [],
                "confidence_score": 0.9,
                "analysis_details": "No allergens detected"
            }
    
    return MockGemini()


# Test data fixtures
@pytest.fixture
def sample_user_data():
    """Sample user data for testing."""
    return {
        "email": "test@example.com",
        "password": "testpassword123",
        "first_name": "Test",
        "last_name": "User"
    }


@pytest.fixture
def sample_allergen_profile():
    """Sample allergen profile for testing."""
    return {
        "peanuts": True,
        "tree_nuts": False,
        "shellfish": True,
        "fish": False,
        "gluten": False,
        "dairy": True,
        "eggs": False,
        "soy": False,
        "sesame": False,
        "sulfites": False,
        "mustard": False,
        "celery": False,
        "lupin": False,
        "mollusks": False,
        "custom_allergens": ["citrus"],
        "severity_level": "moderate"
    }


@pytest.fixture
def sample_food_data():
    """Sample food data for testing."""
    return {
        "food_id": "12345",
        "food_name": "Chocolate Chip Cookies",
        "brand_name": "Test Brand",
        "ingredients": ["wheat flour", "sugar", "butter", "eggs", "chocolate chips"],
        "nutrition": {
            "calories": 150,
            "protein": 2.0,
            "carbohydrates": 22.0,
            "fat": 6.0
        }
    }


@pytest.fixture
def sample_scan_data():
    """Sample scan data for testing."""
    return {
        "scan_type": "image",
        "food_name": "Test Food Item",
        "ingredients": ["wheat flour", "eggs", "milk"],
        "nutrition": {
            "calories": 250,
            "protein": 8.5,
            "carbohydrates": 35.2,
            "fat": 9.1
        }
    }


# Utility functions for tests
def create_test_image():
    """Create a test image for upload testing."""
    from PIL import Image
    import io
    
    # Create a simple test image
    img = Image.new('RGB', (100, 100), color='red')
    img_io = io.BytesIO()
    img.save(img_io, format='JPEG')
    img_io.seek(0)
    return img_io.getvalue()


def create_test_audio():
    """Create test audio data for voice testing."""
    import base64
    
    # Create a simple test audio (silence)
    audio_data = b'\x00' * 1000  # 1 second of silence
    return base64.b64encode(audio_data).decode('utf-8')


# Test configuration
pytest_plugins = []

# Configure pytest
def pytest_configure(config):
    """Configure pytest with custom settings."""
    config.addinivalue_line(
        "markers", "slow: marks tests as slow (deselect with '-m \"not slow\"')"
    )
    config.addinivalue_line(
        "markers", "integration: marks tests as integration tests"
    )
    config.addinivalue_line(
        "markers", "unit: marks tests as unit tests"
    )


# Test utilities
class TestUtils:
    """Utility class for test helpers."""
    
    @staticmethod
    def assert_response_success(response, expected_status=200):
        """Assert that a response is successful."""
        assert response.status_code == expected_status
        assert "error" not in response.json()
    
    @staticmethod
    def assert_response_error(response, expected_status=400):
        """Assert that a response contains an error."""
        assert response.status_code == expected_status
        assert "error" in response.json() or "detail" in response.json()
    
    @staticmethod
    def create_auth_headers(token="test-token"):
        """Create authentication headers for testing."""
        return {"Authorization": f"Bearer {token}"}
    
    @staticmethod
    def assert_food_data_structure(data):
        """Assert that food data has the correct structure."""
        required_fields = ["food_id", "food_name"]
        for field in required_fields:
            assert field in data
        
        if "ingredients" in data:
            assert isinstance(data["ingredients"], list)
        
        if "nutrition" in data:
            assert isinstance(data["nutrition"], dict)
    
    @staticmethod
    def assert_allergen_analysis_structure(data):
        """Assert that allergen analysis has the correct structure."""
        required_fields = [
            "is_safe", "risk_level", "detected_allergens",
            "risk_factors", "recommendations", "confidence_score"
        ]
        for field in required_fields:
            assert field in data
        
        assert isinstance(data["is_safe"], bool)
        assert data["risk_level"] in ["low", "medium", "high", "critical"]
        assert isinstance(data["detected_allergens"], list)
        assert isinstance(data["risk_factors"], list)
        assert isinstance(data["recommendations"], list)
        assert 0.0 <= data["confidence_score"] <= 1.0