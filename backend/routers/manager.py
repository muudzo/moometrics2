from fastapi import APIRouter, HTTPException
from db import get_cursor, conn
from schemas import ManagerCreate, Manager
from typing import List

router = APIRouter(prefix="/managers", tags=["managers"])

@router.post("/", response_model=Manager)
def create_manager(manager: ManagerCreate):
    cursor = get_cursor()
    cursor.execute(
        "INSERT INTO managers (name, role) VALUES (%s, %s) RETURNING id, name, role;",
        (manager.name, manager.role)
    )
    result = cursor.fetchone()
    conn.commit()
    cursor.close()
    return {"id": result[0], "name": result[1], "role": result[2]}

@router.get("/", response_model=List[Manager])
def list_managers():
    cursor = get_cursor()
    cursor.execute("SELECT id, name, role FROM managers;")
    managers = cursor.fetchall()
    cursor.close()
    return [{"id": m[0], "name": m[1], "role": m[2]} for m in managers]
