from typing import Optional
from datetime import datetime
from sqlalchemy.orm import Session
from app.models import RefreshToken

def get_refresh_token(db: Session, token: str) -> Optional[RefreshToken]:
    return db.query(RefreshToken).filter(RefreshToken.token == token).first()

def create_refresh_token(db: Session, token: str, user_id: str, expires_at: datetime) -> RefreshToken:
    db_token = RefreshToken(token=token, user_id=user_id, expires_at=expires_at)
    db.add(db_token)
    db.commit()
    db.refresh(db_token)
    return db_token

def revoke_refresh_token(db: Session, db_token: RefreshToken) -> RefreshToken:
    db_token.revoked = True
    db.add(db_token)
    db.commit()
    db.refresh(db_token)
    return db_token

def revoke_all_user_tokens(db: Session, user_id: str):
    db.query(RefreshToken).filter(RefreshToken.user_id == user_id).update({"revoked": True})
    db.commit()
