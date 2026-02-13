from typing import List, Optional
from sqlalchemy.orm import Session
from app.models import Farm
from app.schemas.farm import FarmCreate, FarmUpdate


def get_farm(db: Session, farm_id: int):
    return db.query(Farm).filter(Farm.id == farm_id).first()


def get_farms_by_owner(db: Session, owner_id: str, skip: int = 0, limit: int = 100):
    return (
        db.query(Farm)
        .filter(Farm.owner_id == owner_id)
        .offset(skip)
        .limit(limit)
        .all()
    )


def create_farm(db: Session, farm: FarmCreate, owner_id: str):
    db_farm = Farm(**farm.model_dump(), owner_id=owner_id)
    db.add(db_farm)
    db.commit()
    db.refresh(db_farm)
    return db_farm


def update_farm(db: Session, db_farm: Farm, farm_update: FarmUpdate):
    update_data = farm_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_farm, key, value)
    db.add(db_farm)
    db.commit()
    db.refresh(db_farm)
    return db_farm


def delete_farm(db: Session, db_farm: Farm):
    db.delete(db_farm)
    db.commit()
    return db_farm
