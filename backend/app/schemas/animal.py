from typing import Optional
from pydantic import BaseModel
from datetime import datetime


class AnimalBase(BaseModel):
    tag_number: str
    type: str
    health_status: str
    vaccination_status: str
    farm_id: int


class AnimalCreate(AnimalBase):
    pass


class AnimalUpdate(AnimalBase):
    tag_number: Optional[str] = None
    type: Optional[str] = None
    health_status: Optional[str] = None
    vaccination_status: Optional[str] = None
    farm_id: Optional[int] = None


class AnimalInDBBase(AnimalBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Animal(AnimalInDBBase):
    pass
