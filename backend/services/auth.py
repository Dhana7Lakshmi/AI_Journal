"""
services/auth.py
────────────────
Provides user authentication, password hashing with bcrypt, JWT token generation,
and FastAPI dependencies for checking route authentication.
"""

from datetime import datetime, timedelta, timezone
import logging
from typing import Optional

import bcrypt
from bson import ObjectId
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import jwt

from config.database import users
from config.settings import settings

logger = logging.getLogger(__name__)

# Scheme to extract bearer token from Authorization header.
# OAuth2PasswordBearer automatically looks for 'Authorization: Bearer <token>'
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=True)

# ──────────────────────────────────────────────────────────────────────────────
# Password Hashing
# ──────────────────────────────────────────────────────────────────────────────

def hash_password(password: str) -> str:
    """Hash a plaintext password using bcrypt."""
    pwd_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode("utf-8")


def verify_password(password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against a stored bcrypt hash."""
    pwd_bytes = password.encode("utf-8")
    hashed_bytes = hashed_password.encode("utf-8")
    try:
        return bcrypt.checkpw(pwd_bytes, hashed_bytes)
    except Exception as exc:
        logger.error("Error verifying password hash", extra={"error": str(exc)})
        return False


# ──────────────────────────────────────────────────────────────────────────────
# JWT Token Generation & Verification
# ──────────────────────────────────────────────────────────────────────────────

def create_access_token(user_id: str, expires_delta: Optional[timedelta] = None) -> str:
    """
    Generate a signed JWT token containing the user's ObjectId in the 'sub' claim.
    """
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(days=7)  # Default 7 days expiry

    to_encode = {
        "sub": str(user_id),
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }

    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt


async def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    """
    FastAPI dependency to extract and validate the JWT from the Authorization header.
    Returns the authenticated MongoDB user document, or raises 401 Unauthorized.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        user_id_str: str = payload.get("sub")
        if not user_id_str:
            raise credentials_exception
    except jwt.PyJWTError as exc:
        logger.warning("JWT validation failed", extra={"error": str(exc)})
        raise credentials_exception

    try:
        user = users.find_one({"_id": ObjectId(user_id_str)})
        if not user:
            logger.warning("Authenticated user not found in database", extra={"user_id": user_id_str})
            raise credentials_exception
        return user
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Database error looking up authenticated user", extra={"error": str(exc)})
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during authentication"
        )
