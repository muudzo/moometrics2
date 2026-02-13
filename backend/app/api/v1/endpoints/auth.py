from datetime import timedelta
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app import crud, models, schemas
from app.api import deps
from app.core import security
from app.core.config import get_settings

settings = get_settings()
router = APIRouter()


@router.post("/login", response_model=schemas.token.Token)
def login_access_token(
    db: Session = Depends(deps.get_db), form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests.
    """
    user = crud.crud_user.authenticate(
        db, email=form_data.username, password=form_data.password
    )
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    elif not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    refresh_token_expires = timedelta(days=settings.refresh_token_expire_days)
    
    access_token = security.create_access_token(
        {"sub": user.email}, expires_delta=access_token_expires
    )
    
    # Create refresh token
    import uuid
    from datetime import datetime
    refresh_token_str = str(uuid.uuid4())
    expires_at = datetime.utcnow() + refresh_token_expires
    
    crud.crud_token.create_refresh_token(
        db, token=refresh_token_str, user_id=user.id, expires_at=expires_at
    )
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token_str,
        "token_type": "bearer",
    }


@router.post("/refresh", response_model=schemas.token.Token)
def refresh_token(
    refresh_token: str,
    db: Session = Depends(deps.get_db),
) -> Any:
    """
    Refresh access token.
    """
    # Find token
    db_token = crud.crud_token.get_refresh_token(db, token=refresh_token)
    if not db_token:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    
    # Check if revoked or expired
    if db_token.revoked:
         raise HTTPException(status_code=401, detail="Token revoked")
         
    from datetime import datetime
    if db_token.expires_at < datetime.utcnow():
        raise HTTPException(status_code=401, detail="Token expired")
        
    # Get user
    user = crud.crud_user.get_user(db, user_id=db_token.user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    # Rotate token: revoke old, create new
    crud.crud_token.revoke_refresh_token(db, db_token)
    
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    refresh_token_expires = timedelta(days=settings.refresh_token_expire_days)
    
    access_token = security.create_access_token(
        {"sub": user.email}, expires_delta=access_token_expires
    )
    
    import uuid
    new_refresh_token_str = str(uuid.uuid4())
    new_expires_at = datetime.utcnow() + refresh_token_expires
    
    crud.crud_token.create_refresh_token(
        db, token=new_refresh_token_str, user_id=user.id, expires_at=new_expires_at
    )
    
    return {
        "access_token": access_token,
        "refresh_token": new_refresh_token_str,
        "token_type": "bearer",
    }


@router.post("/revoke", response_model=Any)
def revoke_token(
    refresh_token: str,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """
    Revoke a refresh token.
    """
    db_token = crud.crud_token.get_refresh_token(db, token=refresh_token)
    if not db_token:
        raise HTTPException(status_code=404, detail="Token not found")
        
    if db_token.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
        
    crud.crud_token.revoke_refresh_token(db, db_token)
    return {"message": "Token revoked"}


@router.post("/register", response_model=schemas.user.User)
def register_user(
    *,
    db: Session = Depends(deps.get_db),
    user_in: schemas.user.UserCreate,
) -> Any:
    """
    Create new user.
    """
    user = crud.crud_user.get_user_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this username already exists in the system",
        )
    user = crud.crud_user.create_user(db, user=user_in)
    return user
