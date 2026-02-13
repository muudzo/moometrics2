from typing import Optional
from pydantic import BaseModel
from datetime import datetime


class FarmBase(BaseModel):
    name: str


class FarmCreate(FarmBase):
    pass


class FarmUpdate(FarmBase):
    name: Optional[str] = None


class FarmInDBBase(FarmBase):
    id: int
    owner_id: str
    created_at: datetime

    class Config:
        from_attributes = True


class Farm(FarmInDBBase):
    pass
