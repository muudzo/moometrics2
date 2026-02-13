from pydantic import BaseModel
from typing import Optional
from datetime import date

class WorkerBase(BaseModel):
    name: str
    role: str = "worker"

class WorkerCreate(WorkerBase):
    pass

class Worker(WorkerBase):
    id: int
    class Config:
        from_attributes = True

class EmployeeBase(BaseModel):
    name: str
    role: str = "employee"

class EmployeeCreate(EmployeeBase):
    pass

class Employee(EmployeeBase):
    id: int
    class Config:
        from_attributes = True

class ManagerBase(BaseModel):
    name: str
    role: str = "manager"

class ManagerCreate(ManagerBase):
    pass

class Manager(ManagerBase):
    id: int
    class Config:
        from_attributes = True

import datetime

class FarmRecordBase(BaseModel):
    worker_id: int
    activity: str
    date: Optional[datetime.date] = None

class FarmRecordCreate(FarmRecordBase):
    pass

class FarmRecord(FarmRecordBase):
    id: int
    class Config:
        from_attributes = True
