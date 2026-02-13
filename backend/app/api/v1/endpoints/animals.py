from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import crud, models, schemas
from app.api import deps

router = APIRouter()


@router.get("/", response_model=List[schemas.animal.Animal])
def read_animals(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    farm_id: int = None,
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """
    Retrieve animals. Optionally filter by farm_id.
    """
    if farm_id:
        farm = crud.crud_farm.get_farm(db=db, farm_id=farm_id)
        if not farm:
            raise HTTPException(status_code=404, detail="Farm not found")
        if farm.owner_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not enough permissions")
        animals = crud.crud_animal.get_animals_by_farm(
            db=db, farm_id=farm_id, skip=skip, limit=limit
        )
    else:
        # If no farm specified, return all animals from all user's farms ??
        # Or just return empty list or error?
        # Better: get all farms of user, then get animals.
        # But for simplicity, let's require farm_id or return 400.
        # Alternatively, find all farms and query animals in those farms.
        user_farms = crud.crud_farm.get_farms_by_owner(db=db, owner_id=current_user.id)
        farm_ids = [farm.id for farm in user_farms]
        animals = (
            db.query(models.Animal)
            .filter(models.Animal.farm_id.in_(farm_ids))
            .offset(skip)
            .limit(limit)
            .all()
        )
    return animals


@router.post("/", response_model=schemas.animal.Animal)
def create_animal(
    *,
    db: Session = Depends(deps.get_db),
    animal_in: schemas.animal.AnimalCreate,
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """
    Create new animal.
    """
    farm = crud.crud_farm.get_farm(db=db, farm_id=animal_in.farm_id)
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    if farm.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    animal = crud.crud_animal.create_animal(db=db, animal=animal_in)
    return animal


@router.put("/{animal_id}", response_model=schemas.animal.Animal)
def update_animal(
    *,
    db: Session = Depends(deps.get_db),
    animal_id: int,
    animal_in: schemas.animal.AnimalUpdate,
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """
    Update an animal.
    """
    animal = crud.crud_animal.get_animal(db=db, animal_id=animal_id)
    if not animal:
        raise HTTPException(status_code=404, detail="Animal not found")
    
    # Check permission via farm
    farm = crud.crud_farm.get_farm(db=db, farm_id=animal.farm_id)
    if not farm or farm.owner_id != current_user.id:
         raise HTTPException(status_code=403, detail="Not enough permissions")

    animal = crud.crud_animal.update_animal(db=db, db_animal=animal, animal_update=animal_in)
    return animal


@router.delete("/{animal_id}", response_model=schemas.animal.Animal)
def delete_animal(
    *,
    db: Session = Depends(deps.get_db),
    animal_id: int,
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """
    Delete an animal.
    """
    animal = crud.crud_animal.get_animal(db=db, animal_id=animal_id)
    if not animal:
        raise HTTPException(status_code=404, detail="Animal not found")
        
    farm = crud.crud_farm.get_farm(db=db, farm_id=animal.farm_id)
    if not farm or farm.owner_id != current_user.id:
         raise HTTPException(status_code=403, detail="Not enough permissions")
         
    animal = crud.crud_animal.delete_animal(db=db, db_animal=animal)
    return animal
