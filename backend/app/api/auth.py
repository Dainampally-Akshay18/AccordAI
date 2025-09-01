# auth.py
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
import jwt
from datetime import datetime, timedelta, timezone
import uuid
import logging
from app.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)
security = HTTPBearer()

# JWT Configuration
JWT_SECRET_KEY = settings.JWT_SECRET_KEY if hasattr(settings, 'JWT_SECRET_KEY') else "your-super-secret-jwt-key-change-in-production"
JWT_ALGORITHM = "HS256"
JWT_ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

class SessionRequest(BaseModel):
    client_info: str = "web_client"

class SessionResponse(BaseModel):
    access_token: str
    token_type: str
    expires_in: int
    session_id: str
    created_at: str

class TokenValidationResponse(BaseModel):
    valid: bool
    session_id: str
    expires_at: str
    created_at: str

def create_access_token(data: dict, expires_delta: timedelta = None):
    """Create JWT access token"""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "type": "access_token"
    })
    
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> dict:
    """Verify and decode JWT token"""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_session(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Dependency to get current session from JWT token"""
    token = credentials.credentials
    payload = verify_token(token)
    
    return {
        "session_id": payload.get("session_id"),
        "created_at": payload.get("created_at"),
        "expires_at": payload.get("exp")
    }

@router.post("/create-session", response_model=SessionResponse)
async def create_session(request: SessionRequest):
    """Create a new session with JWT token"""
    try:
        # Generate unique session ID
        session_id = f"session_{uuid.uuid4().hex}_{int(datetime.now().timestamp())}"
        created_at = datetime.now(timezone.utc).isoformat()
        
        # Create token payload
        token_data = {
            "session_id": session_id,
            "client_info": request.client_info,
            "created_at": created_at
        }
        
        # Create JWT token
        access_token = create_access_token(data=token_data)
        
        logger.info(f"Created new session: {session_id}")
        
        return SessionResponse(
            access_token=access_token,
            token_type="bearer",
            expires_in=JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,  # in seconds
            session_id=session_id,
            created_at=created_at
        )
        
    except Exception as e:
        logger.error(f"Failed to create session: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create session")

@router.post("/validate-token", response_model=TokenValidationResponse)
async def validate_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Validate JWT token and return session info"""
    try:
        payload = verify_token(credentials.credentials)
        
        return TokenValidationResponse(
            valid=True,
            session_id=payload.get("session_id"),
            expires_at=datetime.fromtimestamp(payload.get("exp"), tz=timezone.utc).isoformat(),
            created_at=payload.get("created_at")
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Token validation error: {str(e)}")
        raise HTTPException(status_code=500, detail="Token validation failed")

@router.post("/refresh-token")
async def refresh_token(current_session: dict = Depends(get_current_session)):
    """Refresh JWT token"""
    try:
        # Create new token with same session data
        token_data = {
            "session_id": current_session["session_id"],
            "client_info": "web_client",
            "created_at": current_session["created_at"]
        }
        
        new_token = create_access_token(data=token_data)
        
        return {
            "access_token": new_token,
            "token_type": "bearer",
            "expires_in": JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            "session_id": current_session["session_id"]
        }
        
    except Exception as e:
        logger.error(f"Token refresh failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Token refresh failed")

@router.get("/session-info")
async def get_session_info(current_session: dict = Depends(get_current_session)):
    """Get current session information"""
    return {
        "session_id": current_session["session_id"],
        "created_at": current_session["created_at"],
        "expires_at": datetime.fromtimestamp(current_session["expires_at"], tz=timezone.utc).isoformat(),
        "status": "active",
        "token_valid": True
    }

# Export router
authRoutes = router
