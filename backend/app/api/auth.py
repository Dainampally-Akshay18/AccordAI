import logging
import os
import json
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
import firebase_admin
from firebase_admin import auth, credentials
from app.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)
security = HTTPBearer()

# --- 1. Firebase Initialization ---
try:
    if not firebase_admin._apps:
        # Strategy 1: Try Environment Variables (Config)
        if settings.FIREBASE_PROJECT_ID and settings.FIREBASE_PRIVATE_KEY and settings.FIREBASE_CLIENT_EMAIL:
            # Handle private key formatting (restore newlines if they were escaped)
            private_key = settings.FIREBASE_PRIVATE_KEY.replace('\\n', '\n')
            
            cred_dict = {
                "type": "service_account",
                "project_id": settings.FIREBASE_PROJECT_ID,
                "private_key_id": "obtained-from-env",
                "private_key": private_key,
                "client_email": settings.FIREBASE_CLIENT_EMAIL,
                "client_id": "obtained-from-env",
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
                "client_x509_cert_url": f"https://www.googleapis.com/robot/v1/metadata/x509/{settings.FIREBASE_CLIENT_EMAIL}"
            }
            cred = credentials.Certificate(cred_dict)
            firebase_admin.initialize_app(cred)
            logger.info("Firebase initialized using Environment Variables.")
            
        # Strategy 2: Try JSON File
        else:
            cred_path = os.path.join(os.getcwd(), "firebase-service-account.json")
            if os.path.exists(cred_path):
                cred = credentials.Certificate(cred_path)
                firebase_admin.initialize_app(cred)
                logger.info(f"Firebase initialized using JSON file: {cred_path}")
            else:
                logger.warning(f"Firebase credentials not found. Auth will fail. Checked: Env Vars & {cred_path}")

except Exception as e:
    logger.error(f"Failed to initialize Firebase: {str(e)}")

# --- 2. Models & Dependencies (Same as before) ---

class TokenVerificationResponse(BaseModel):
    valid: bool
    uid: str
    email: str | None
    name: str | None
    picture: str | None

class LoginRequest(BaseModel):
    id_token: str

async def verify_firebase_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    token = credentials.credentials
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        logger.error(f"Authentication error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )

async def get_current_session(decoded_token: dict = Depends(verify_firebase_token)):
    return {
        "session_id": decoded_token.get("uid"),
        "email": decoded_token.get("email"),
        "created_at": decoded_token.get("auth_time")
    }

# --- 3. Routes ---

@router.post("/login", response_model=TokenVerificationResponse)
async def login(request: LoginRequest):
    try:
        decoded_token = auth.verify_id_token(request.id_token)
        return TokenVerificationResponse(
            valid=True,
            uid=decoded_token.get("uid"),
            email=decoded_token.get("email"),
            name=decoded_token.get("name"),
            picture=decoded_token.get("picture")
        )
    except Exception as e:
        logger.error(f"Login validation failed: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid login token")

@router.get("/validate-token")
async def validate_token(decoded_token: dict = Depends(verify_firebase_token)):
    return {
        "valid": True,
        "session_id": decoded_token.get("uid"),
        "email": decoded_token.get("email")
    }

@router.get("/session-info")
async def get_session_info(current_session: dict = Depends(get_current_session)):
    return {
        "session_id": current_session["session_id"],
        "email": current_session.get("email"),
        "status": "active",
        "provider": "firebase"
    }

authRoutes = router