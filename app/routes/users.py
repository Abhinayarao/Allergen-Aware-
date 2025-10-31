from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
import jwt
from datetime import datetime, timedelta

from ..auth import get_supabase_client
from ..models.user import UserCreate, UserLogin, UserResponse, UserProfile, UserProfileUpdate
from ..models.allergen import AllergenProfile, AllergenProfileUpdate

router = APIRouter()
security = HTTPBearer()

def get_current_user_id(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """Extract user ID from JWT token."""
    try:
        # In a real implementation, you'd verify the JWT with Supabase
        # For now, we'll assume the token contains the user ID
        payload = jwt.decode(credentials.credentials, options={"verify_signature": False})
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.post("/register", response_model=dict)
async def register(user_data: UserCreate):
    """Register a new user."""
    supabase = get_supabase_client()
    
    try:
        # Register user with Supabase Auth
        response = supabase.auth.sign_up({
            "email": user_data.email,
            "password": user_data.password,
            "options": {
                "data": {
                    "first_name": user_data.first_name,
                    "last_name": user_data.last_name
                }
            }
        })
        
        if response.user:
            return {
                "message": "User registered successfully",
                "user_id": response.user.id,
                "email": response.user.email
            }
        else:
            raise HTTPException(status_code=400, detail="Registration failed")
            
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Registration failed: {str(e)}")

@router.post("/login", response_model=dict)
async def login(login_data: UserLogin):
    """Login user and return access token."""
    supabase = get_supabase_client()
    
    try:
        response = supabase.auth.sign_in_with_password({
            "email": login_data.email,
            "password": login_data.password
        })
        
        if response.user and response.session:
            return {
                "access_token": response.session.access_token,
                "refresh_token": response.session.refresh_token,
                "user_id": response.user.id,
                "email": response.user.email
            }
        else:
            raise HTTPException(status_code=401, detail="Invalid credentials")
            
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Login failed: {str(e)}")

@router.get("/profile", response_model=UserProfile)
async def get_profile(user_id: str = Depends(get_current_user_id)):
    """Get user profile."""
    supabase = get_supabase_client()
    
    try:
        response = supabase.table("user_profiles").select("*").eq("user_id", user_id).execute()
        
        if response.data:
            return UserProfile(**response.data[0])
        else:
            # Create default profile if none exists
            profile_data = {
                "user_id": user_id,
                "email": "",  # Will be filled from auth
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }
            response = supabase.table("user_profiles").insert(profile_data).execute()
            return UserProfile(**response.data[0])
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get profile: {str(e)}")

@router.put("/profile", response_model=UserProfile)
async def update_profile(
    profile_update: UserProfileUpdate,
    user_id: str = Depends(get_current_user_id)
):
    """Update user profile."""
    supabase = get_supabase_client()
    
    try:
        update_data = profile_update.dict(exclude_unset=True)
        update_data["updated_at"] = datetime.utcnow().isoformat()
        
        response = supabase.table("user_profiles").update(update_data).eq("user_id", user_id).execute()
        
        if response.data:
            return UserProfile(**response.data[0])
        else:
            raise HTTPException(status_code=404, detail="Profile not found")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update profile: {str(e)}")

@router.get("/allergens", response_model=AllergenProfile)
async def get_allergen_profile(user_id: str = Depends(get_current_user_id)):
    """Get user's allergen profile."""
    supabase = get_supabase_client()
    
    try:
        response = supabase.table("allergen_profiles").select("*").eq("user_id", user_id).execute()
        
        if response.data:
            return AllergenProfile(**response.data[0])
        else:
            # Create default allergen profile if none exists
            allergen_data = {
                "user_id": user_id,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }
            response = supabase.table("allergen_profiles").insert(allergen_data).execute()
            return AllergenProfile(**response.data[0])
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get allergen profile: {str(e)}")

@router.put("/allergens", response_model=AllergenProfile)
async def update_allergen_profile(
    allergen_update: AllergenProfileUpdate,
    user_id: str = Depends(get_current_user_id)
):
    """Update user's allergen profile."""
    supabase = get_supabase_client()
    
    try:
        update_data = allergen_update.dict(exclude_unset=True)
        update_data["updated_at"] = datetime.utcnow().isoformat()
        
        response = supabase.table("allergen_profiles").update(update_data).eq("user_id", user_id).execute()
        
        if response.data:
            return AllergenProfile(**response.data[0])
        else:
            raise HTTPException(status_code=404, detail="Allergen profile not found")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update allergen profile: {str(e)}")

@router.post("/logout")
async def logout(user_id: str = Depends(get_current_user_id)):
    """Logout user."""
    supabase = get_supabase_client()
    
    try:
        supabase.auth.sign_out()
        return {"message": "Logged out successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Logout failed: {str(e)}")
