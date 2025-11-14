import json
import os
from typing import Any, Dict, Optional

from dotenv import load_dotenv

import firebase_admin
from firebase_admin import credentials, firestore, auth as firebase_auth


load_dotenv()


FIREBASE_PROJECT_ID = os.getenv("FIREBASE_PROJECT_ID")
FIREBASE_API_KEY = os.getenv("FIREBASE_API_KEY")
FIREBASE_SERVICE_ACCOUNT_FILE = (
    os.getenv("FIREBASE_SERVICE_ACCOUNT_FILE")
    or os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
)
FIREBASE_SERVICE_ACCOUNT_JSON = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")


firebase_app: Optional[firebase_admin.App] = None
firestore_client: Optional[firestore.Client] = None


def _load_credentials() -> Optional[credentials.Certificate]:
    if FIREBASE_SERVICE_ACCOUNT_FILE:
        try:
            return credentials.Certificate(FIREBASE_SERVICE_ACCOUNT_FILE)
        except Exception as exc:  # pragma: no cover - defensive guard
            print(
                "WARNING: Failed to load Firebase service account file. "
                f"Details: {exc}"
            )
            return None

    if FIREBASE_SERVICE_ACCOUNT_JSON:
        try:
            service_account_info: Dict[str, Any] = json.loads(FIREBASE_SERVICE_ACCOUNT_JSON)
            return credentials.Certificate(service_account_info)
        except (json.JSONDecodeError, ValueError) as exc:
            print(
                "WARNING: FIREBASE_SERVICE_ACCOUNT_JSON could not be parsed. "
                f"Details: {exc}"
            )
            return None

    print(
        "WARNING: Firebase service account credentials are not configured. "
        "Firebase-dependent features will be unavailable until credentials are provided."
    )
    return None


def _initialize_firebase() -> Optional[firebase_admin.App]:
    global firebase_app, firestore_client

    if firebase_app:
        return firebase_app

    credentials_cert = _load_credentials()
    if credentials_cert is None:
        return None

    init_options: Optional[Dict[str, Any]] = None
    if FIREBASE_PROJECT_ID:
        init_options = {"projectId": FIREBASE_PROJECT_ID}

    try:
        firebase_app = firebase_admin.initialize_app(credentials_cert, init_options)
        firestore_client = firestore.client()
    except Exception as exc:  # pragma: no cover - initialization guard
        firebase_app = None
        firestore_client = None
        print(
            "WARNING: Failed to initialize Firebase. "
            f"Firebase-dependent features are disabled. Details: {exc}"
        )

    return firebase_app


def get_firestore_client() -> firestore.Client:
    if not _initialize_firebase() or firestore_client is None:
        raise RuntimeError(
            "Firebase is not configured. Provide FIREBASE_SERVICE_ACCOUNT_* "
            "environment variables to enable Firestore access."
        )
    return firestore_client


def get_firebase_auth():
    if not _initialize_firebase():
        raise RuntimeError(
            "Firebase is not configured. Provide FIREBASE_SERVICE_ACCOUNT_* "
            "environment variables to enable Firebase authentication."
        )
    return firebase_auth


def get_firebase_api_key() -> str:
    if not FIREBASE_API_KEY:
        raise RuntimeError("FIREBASE_API_KEY must be set in environment variables")
    return FIREBASE_API_KEY


def get_firebase_project_id() -> str:
    if not FIREBASE_PROJECT_ID:
        raise RuntimeError("FIREBASE_PROJECT_ID must be set in environment variables")
    return FIREBASE_PROJECT_ID

