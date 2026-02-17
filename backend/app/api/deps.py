from typing import Generator, Optional

import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app import models, schemas
from app.core import security
from app.core.config import get_settings
from app.core.database import get_db
from app.crud.crud_user import get_user_by_email

settings = get_settings()

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.api_v1_str}/auth/login" if hasattr(settings, "api_v1_str") else "/api/v1/auth/login"
)


def _get_or_create_user_from_email(db: Session, email: str) -> models.User:
    user = get_user_by_email(db, email=email)
    if user:
        return user

    # Create a lightweight local user record linked to Supabase identity
    placeholder_password = security.get_password_hash("!supabase_managed!")
    user = models.User(email=email, hashed_password=placeholder_password, is_active=True)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _get_supabase_user_email_from_token(token: str) -> Optional[str]:
    if not settings.supabase_url or not settings.supabase_key:
        return None

    url = f"{settings.supabase_url}/auth/v1/user"
    headers = {
        "Authorization": f"Bearer {token}",
        "apikey": settings.supabase_key,
    }

    try:
        with httpx.Client(timeout=5.0) as client:
            resp = client.get(str(url), headers=headers)
    except httpx.RequestError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to reach authentication service",
        )

    if resp.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Supabase token",
        )

    data = resp.json()
    email = data.get("email")
    return email


def get_current_user(
    db: Session = Depends(get_db), token: str = Depends(reusable_oauth2)
) -> models.User:
    # Supabase-managed authentication
    if settings.auth_provider == "supabase":
        email = _get_supabase_user_email_from_token(token)
        if not email:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Could not validate Supabase credentials",
            )
        return _get_or_create_user_from_email(db, email=email)

    # Local JWT-based authentication (existing behavior)
    try:
        payload = jwt.decode(
            token, settings.secret_key, algorithms=[settings.algorithm]
        )
        token_data = schemas.token.TokenPayload(**payload)
    except (JWTError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
    user = get_user_by_email(db, email=token_data.sub)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return user
