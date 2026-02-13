from typing import List
from sqlalchemy.orm import Session
from app.models import Animal
from app.schemas.animal import AnimalCreate, AnimalUpdate


def get_animal(db: Session, animal_id: int):
    return db.query(Animal).filter(Animal.id == animal_id).first()


def get_animals_by_farm(db: Session, farm_id: int, skip: int = 0, limit: int = 100):
    return (
        db.query(Animal)
        .filter(Animal.farm_id == farm_id)
        .offset(skip)
        .limit(limit)
        .all()
    )


def create_animal(db: Session, animal: AnimalCreate):
    db_animal = Animal(**animal.model_dump())
    db.add(db_animal)
    db.commit()
    db.refresh(db_animal)
    return db_animal


def update_animal(db: Session, db_animal: Animal, animal_update: AnimalUpdate):
    update_data = animal_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_animal, key, value)
    db.add(db_animal)
    db.commit()
    db.refresh(db_animal)
    return db_animal


def delete_animal(db: Session, db_animal: Animal):
    db.delete(db_animal)
    db.commit()
    return db_animal
