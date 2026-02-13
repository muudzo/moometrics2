from sqlalchemy.orm import Session
from app.models import Crop
from app.schemas.crop import CropCreate, CropUpdate


def get_crop(db: Session, crop_id: int):
    return db.query(Crop).filter(Crop.id == crop_id).first()


def get_crops_by_farm(db: Session, farm_id: int, skip: int = 0, limit: int = 100):
    return (
        db.query(Crop)
        .filter(Crop.farm_id == farm_id)
        .offset(skip)
        .limit(limit)
        .all()
    )


def create_crop(db: Session, crop: CropCreate):
    db_crop = Crop(**crop.model_dump())
    db.add(db_crop)
    db.commit()
    db.refresh(db_crop)
    return db_crop


def update_crop(db: Session, db_crop: Crop, crop_update: CropUpdate):
    update_data = crop_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_crop, key, value)
    db.add(db_crop)
    db.commit()
    db.refresh(db_crop)
    return db_crop


def delete_crop(db: Session, db_crop: Crop):
    db.delete(db_crop)
    db.commit()
    return db_crop
