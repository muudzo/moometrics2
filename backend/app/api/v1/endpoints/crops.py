from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import crud, models, schemas
from app.api import deps

router = APIRouter()


@router.get("/", response_model=List[schemas.crop.Crop])
def read_crops(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    farm_id: int = None,
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """
    Retrieve crops. Optionally filter by farm_id.
    """
    if farm_id:
        farm = crud.crud_farm.get_farm(db=db, farm_id=farm_id)
        if not farm:
            raise HTTPException(status_code=404, detail="Farm not found")
        if farm.owner_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not enough permissions")
        crops = crud.crud_crop.get_crops_by_farm(
            db=db, farm_id=farm_id, skip=skip, limit=limit
        )
    else:
        user_farms = crud.crud_farm.get_farms_by_owner(db=db, owner_id=current_user.id)
        farm_ids = [farm.id for farm in user_farms]
        crops = (
            db.query(models.Crop)
            .filter(models.Crop.farm_id.in_(farm_ids))
            .offset(skip)
            .limit(limit)
            .all()
        )
    return crops


@router.post("/", response_model=schemas.crop.Crop)
def create_crop(
    *,
    db: Session = Depends(deps.get_db),
    crop_in: schemas.crop.CropCreate,
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """
    Create new crop.
    """
    farm = crud.crud_farm.get_farm(db=db, farm_id=crop_in.farm_id)
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    if farm.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    crop = crud.crud_crop.create_crop(db=db, crop=crop_in)
    return crop


@router.put("/{crop_id}", response_model=schemas.crop.Crop)
def update_crop(
    *,
    db: Session = Depends(deps.get_db),
    crop_id: int,
    crop_in: schemas.crop.CropUpdate,
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """
    Update a crop.
    """
    crop = crud.crud_crop.get_crop(db=db, crop_id=crop_id)
    if not crop:
        raise HTTPException(status_code=404, detail="Crop not found")
    
    farm = crud.crud_farm.get_farm(db=db, farm_id=crop.farm_id)
    if not farm or farm.owner_id != current_user.id:
         raise HTTPException(status_code=403, detail="Not enough permissions")

    crop = crud.crud_crop.update_crop(db=db, db_crop=crop, crop_update=crop_in)
    return crop


@router.delete("/{crop_id}", response_model=schemas.crop.Crop)
def delete_crop(
    *,
    db: Session = Depends(deps.get_db),
    crop_id: int,
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """
    Delete a crop.
    """
    crop = crud.crud_crop.get_crop(db=db, crop_id=crop_id)
    if not crop:
        raise HTTPException(status_code=404, detail="Crop not found")
        
    farm = crud.crud_farm.get_farm(db=db, farm_id=crop.farm_id)
    if not farm or farm.owner_id != current_user.id:
         raise HTTPException(status_code=403, detail="Not enough permissions")
         
    crop = crud.crud_crop.delete_crop(db=db, db_crop=crop)
    return crop
