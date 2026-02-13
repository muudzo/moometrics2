from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import crud, models, schemas
from app.api import deps

router = APIRouter()


@router.get("/", response_model=List[schemas.farm.Farm])
def read_farms(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """
    Retrieve farms.
    """
    farms = crud.crud_farm.get_farms_by_owner(
        db=db, owner_id=current_user.id, skip=skip, limit=limit
    )
    return farms


@router.post("/", response_model=schemas.farm.Farm)
def create_farm(
    *,
    db: Session = Depends(deps.get_db),
    farm_in: schemas.farm.FarmCreate,
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """
    Create new farm.
    """
    farm = crud.crud_farm.create_farm(db=db, farm=farm_in, owner_id=current_user.id)
    return farm


@router.get("/{farm_id}", response_model=schemas.farm.Farm)
def read_farm(
    *,
    db: Session = Depends(deps.get_db),
    farm_id: int,
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """
    Get farm by ID.
    """
    farm = crud.crud_farm.get_farm(db=db, farm_id=farm_id)
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    if farm.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return farm
