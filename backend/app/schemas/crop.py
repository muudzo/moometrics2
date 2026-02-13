from typing import Optional
from pydantic import BaseModel
from datetime import datetime


class CropBase(BaseModel):
    name: str
    planting_date: datetime
    harvest_date: Optional[datetime] = None
    farm_id: int


class CropCreate(CropBase):
    pass


class CropUpdate(CropBase):
    name: Optional[str] = None
    planting_date: Optional[datetime] = None
    harvest_date: Optional[datetime] = None
    farm_id: Optional[int] = None


class CropInDBBase(CropBase):
    id: int

    class Config:
        from_attributes = True


class Crop(CropInDBBase):
    pass
