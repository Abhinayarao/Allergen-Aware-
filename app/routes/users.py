from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from datetime import datetime
from typing import Any, Dict, List

import requests
from firebase_admin import exceptions as firebase_exceptions
from google.cloud import firestore as g_firestore

from ..firebase import get_firestore_client, get_firebase_auth, get_firebase_api_key
from ..models.user import UserCreate, UserLogin, UserProfileUpdate
from ..models.allergen import AllergenProfile, AllergenProfileUpdate


router = APIRouter()
security = HTTPBearer()


def _sign_in_with_password(email: str, password: str) -> Dict[str, Any]:
    api_key = get_firebase_api_key()
    url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={api_key}"
    payload = {
        "email": email,
        "password": password,
        "returnSecureToken": True,
    }

    response = requests.post(url, json=payload, timeout=10)

    if response.status_code != 200:
        try:
            data = response.json()
            message = data.get("error", {}).get("message", "Invalid credentials")
        except ValueError:
            message = "Invalid credentials"
        raise HTTPException(status_code=401, detail=message)

    data = response.json()
    return {
        "access_token": data.get("idToken"),
        "refresh_token": data.get("refreshToken"),
        "user_id": data.get("localId"),
        "email": data.get("email"),
        "expires_in": data.get("expiresIn"),
    }


def _format_datetime(value: Any) -> Any:
    if isinstance(value, datetime):
        return value.isoformat()
    return value


def _build_profile_response(profile: Dict[str, Any]) -> Dict[str, Any]:
    first_name = profile.get("first_name")
    last_name = profile.get("last_name")
    name = ""
    if first_name or last_name:
        name = f"{first_name or ''} {last_name or ''}".strip()

    return {
        "name": name or profile.get("name", ""),
        "age": profile.get("age"),
        "gender": profile.get("gender"),
        "email": profile.get("email"),
        "first_name": first_name,
        "last_name": last_name,
        "phone": profile.get("phone"),
        "date_of_birth": profile.get("date_of_birth"),
        "emergency_contact": profile.get("emergency_contact"),
    }


def get_current_user_id(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """Verify Firebase ID token and return the UID."""
    token = credentials.credentials
    try:
        auth_client = get_firebase_auth()
        decoded = auth_client.verify_id_token(token)
        user_id = decoded.get("uid")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except (firebase_exceptions.FirebaseError, ValueError) as exc:
        raise HTTPException(status_code=401, detail="Invalid token") from exc


@router.post("/register", response_model=dict)
async def register(user_data: UserCreate):
    """Register a new user using Firebase Auth and initialise profile."""
    auth_client = get_firebase_auth()
    db = get_firestore_client()

    try:
        user = auth_client.create_user(
            email=user_data.email,
            password=user_data.password,
            display_name=" ".join(
                filter(None, [user_data.first_name, user_data.last_name])
            )
            or None,
        )

        profile_ref = db.collection("user_profiles").document(user.uid)
        timestamp = datetime.utcnow()
        profile_ref.set(
            {
                "user_id": user.uid,
                "email": user.email,
                "first_name": user_data.first_name,
                "last_name": user_data.last_name,
                "created_at": timestamp,
                "updated_at": timestamp,
            },
            merge=True,
        )

        return {
            "message": "User registered successfully",
            "user_id": user.uid,
            "email": user.email,
        }
    except firebase_exceptions.FirebaseError as exc:
        raise HTTPException(status_code=400, detail=f"Registration failed: {exc.message}")


@router.post("/login", response_model=dict)
async def login(login_data: UserLogin):
    """Login user using Firebase Identity Toolkit password verification."""
    tokens = _sign_in_with_password(login_data.email, login_data.password)
    if not tokens.get("access_token"):
        raise HTTPException(status_code=401, detail="Login failed")
    return tokens


@router.get("/profile")
async def get_profile(user_id: str = Depends(get_current_user_id)):
    """Get user profile from Firestore, creating a default if necessary."""
    db = get_firestore_client()
    auth_client = get_firebase_auth()

    try:
        profile_ref = db.collection("user_profiles").document(user_id)
        snapshot = profile_ref.get()

        if snapshot.exists:
            profile = snapshot.to_dict() or {}
        else:
            user_record = auth_client.get_user(user_id)
            timestamp = datetime.utcnow()
            profile = {
                "user_id": user_id,
                "email": user_record.email,
                "created_at": timestamp,
                "updated_at": timestamp,
            }
            profile_ref.set(profile)

        return _build_profile_response(profile)
    except firebase_exceptions.FirebaseError as exc:
        raise HTTPException(status_code=500, detail=f"Failed to get profile: {exc.message}")


@router.put("/profile")
async def update_profile(
    profile_update: UserProfileUpdate,
    user_id: str = Depends(get_current_user_id),
):
    """Update user profile document in Firestore."""
    db = get_firestore_client()

    try:
        update_data = profile_update.dict(exclude_unset=True)

        if "name" in update_data and update_data["name"]:
            name_parts = update_data["name"].split(maxsplit=1)
            update_data["first_name"] = name_parts[0] if name_parts else None
            update_data["last_name"] = name_parts[1] if len(name_parts) > 1 else None
            update_data.pop("name", None)

        update_data["updated_at"] = datetime.utcnow()

        profile_ref = db.collection("user_profiles").document(user_id)
        profile_ref.set(update_data, merge=True)

        snapshot = profile_ref.get()
        profile = snapshot.to_dict() if snapshot.exists else {}
        return _build_profile_response(profile or {})
    except firebase_exceptions.FirebaseError as exc:
        raise HTTPException(status_code=500, detail=f"Failed to update profile: {exc.message}")


@router.get("/allergens", response_model=AllergenProfile)
async def get_allergen_profile(user_id: str = Depends(get_current_user_id)):
    """Retrieve or initialise allergen profile for the user."""
    db = get_firestore_client()

    try:
        doc_ref = db.collection("allergen_profiles").document(user_id)
        snapshot = doc_ref.get()

        if snapshot.exists:
            data = snapshot.to_dict() or {}
        else:
            timestamp = datetime.utcnow()
            data = {
                "user_id": user_id,
                "created_at": timestamp,
                "updated_at": timestamp,
            }
            doc_ref.set(data)

        return AllergenProfile(**data)
    except firebase_exceptions.FirebaseError as exc:
        raise HTTPException(status_code=500, detail=f"Failed to get allergen profile: {exc.message}")


@router.put("/allergens", response_model=AllergenProfile)
async def update_allergen_profile(
    allergen_update: AllergenProfileUpdate,
    user_id: str = Depends(get_current_user_id),
):
    """Update allergen profile document."""
    db = get_firestore_client()

    try:
        update_data = allergen_update.dict(exclude_unset=True)
        update_data["updated_at"] = datetime.utcnow()

        doc_ref = db.collection("allergen_profiles").document(user_id)
        doc_ref.set(update_data, merge=True)

        snapshot = doc_ref.get()
        data = snapshot.to_dict() if snapshot.exists else {}
        return AllergenProfile(**(data or {}))
    except firebase_exceptions.FirebaseError as exc:
        raise HTTPException(status_code=500, detail=f"Failed to update allergen profile: {exc.message}")


@router.post("/logout")
async def logout(user_id: str = Depends(get_current_user_id)):
    """Logout is handled client-side by discarding tokens."""
    return {"message": "Logged out successfully"}


@router.get("/history")
async def get_history(user_id: str = Depends(get_current_user_id)):
    """Get user's scan history ordered by timestamp."""
    db = get_firestore_client()

    try:
        query = (
            db.collection("food_scans")
            .where("user_id", "==", user_id)
            .order_by("created_at", direction=g_firestore.Query.DESCENDING)
        )
        results = query.stream()

        history: List[Dict[str, Any]] = []
        for doc in results:
            data = doc.to_dict() or {}
            entry = {
                "id": doc.id,
                "timestamp": _format_datetime(data.get("created_at")),
            }
            analysis = data.get("analysis_result") or {}
            entry.update(analysis)
            history.append(entry)

        return history
    except firebase_exceptions.FirebaseError as exc:
        raise HTTPException(status_code=500, detail=f"Failed to get history: {exc.message}")


@router.post("/history")
async def add_history(
    history_entry: Dict[str, Any],
    user_id: str = Depends(get_current_user_id),
):
    """Add a new history entry for the user."""
    db = get_firestore_client()

    try:
        analysis = history_entry.get("analysis", {})

        scan_data = {
            "user_id": user_id,
            "scan_type": history_entry.get("scan_type", "image"),
            "food_id": analysis.get("dishName", ""),
            "food_name": analysis.get("dishName", ""),
            "analysis_result": analysis,
            "scan_data": history_entry,
            "created_at": datetime.utcnow(),
        }

        doc_ref = db.collection("food_scans").document()
        doc_ref.set(scan_data)

        return {"message": "History entry added successfully", "id": doc_ref.id}
    except firebase_exceptions.FirebaseError as exc:
        raise HTTPException(status_code=500, detail=f"Failed to add history: {exc.message}")


@router.delete("/history/{entry_id}")
async def delete_history_entry(
    entry_id: str,
    user_id: str = Depends(get_current_user_id),
):
    """Delete a specific history entry if it belongs to the user."""
    db = get_firestore_client()

    try:
        doc_ref = db.collection("food_scans").document(entry_id)
        snapshot = doc_ref.get()

        if not snapshot.exists:
            raise HTTPException(status_code=404, detail="History entry not found")

        data = snapshot.to_dict() or {}
        if data.get("user_id") != user_id:
            raise HTTPException(status_code=403, detail="Not authorised to delete this entry")

        doc_ref.delete()
        return {"message": "History entry deleted successfully"}
    except firebase_exceptions.FirebaseError as exc:
        raise HTTPException(status_code=500, detail=f"Failed to delete history entry: {exc.message}")


@router.delete("/history")
async def clear_history(user_id: str = Depends(get_current_user_id)):
    """Remove all history entries for the user."""
    db = get_firestore_client()

    try:
        query = db.collection("food_scans").where("user_id", "==", user_id)
        docs = list(query.stream())
        for doc in docs:
            doc.reference.delete()

        return {"message": "History cleared successfully"}
    except firebase_exceptions.FirebaseError as exc:
        raise HTTPException(status_code=500, detail=f"Failed to clear history: {exc.message}")
