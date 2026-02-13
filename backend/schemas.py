from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Generic, TypeVar
from datetime import date
import datetime

T = TypeVar('T')

class WorkerBase(BaseModel):
    name: str
    role: str = "worker"

class WorkerCreate(WorkerBase):
    pass

class WorkerUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None

class Worker(WorkerBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class EmployeeBase(BaseModel):
    name: str
    role: str = "employee"

class EmployeeCreate(EmployeeBase):
    pass

class EmployeeUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None

class Employee(EmployeeBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class ManagerBase(BaseModel):
    name: str
    role: str = "manager"

class ManagerCreate(ManagerBase):
    pass

class ManagerUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None

class Manager(ManagerBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class FarmRecordBase(BaseModel):
    worker_id: int
    activity: str
    date: Optional[datetime.date] = None

class FarmRecordCreate(FarmRecordBase):
    pass

class FarmRecordUpdate(BaseModel):
    worker_id: Optional[int] = None
    activity: Optional[str] = None
    date: Optional[datetime.date] = None

class FarmRecord(FarmRecordBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    limit: int
    offset: int
