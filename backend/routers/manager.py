import logging
import psycopg2.errors
from fastapi import APIRouter, HTTPException, Query
from db import get_db_cursor
from schemas import ManagerCreate, Manager, ManagerUpdate, PaginatedResponse
from typing import List

router = APIRouter(prefix="/managers", tags=["managers"])
logger = logging.getLogger("managers")

@router.post("/", response_model=Manager)
def create_manager(manager: ManagerCreate):
    try:
        with get_db_cursor() as cursor:
            cursor.execute(
                "INSERT INTO managers (name, role) VALUES (%s, %s) RETURNING id, name, role;",
                (manager.name, manager.role)
            )
            result = cursor.fetchone()
            cursor.connection.commit()
            return {"id": result[0], "name": result[1], "role": result[2]}
    except psycopg2.errors.UniqueViolation:
        raise HTTPException(status_code=409, detail="Manager already exists")
    except Exception as e:
        logger.error(f"Error creating manager: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.get("/", response_model=PaginatedResponse[Manager])
def list_managers(limit: int = Query(10, le=100), offset: int = Query(0, ge=0)):
    try:
        with get_db_cursor() as cursor:
            cursor.execute("SELECT COUNT(*) FROM managers;")
            total = cursor.fetchone()[0]
            
            cursor.execute("SELECT id, name, role FROM managers LIMIT %s OFFSET %s;", (limit, offset))
            managers = cursor.fetchall()
            
            items = [{"id": m[0], "name": m[1], "role": m[2]} for m in managers]
            return {
                "items": items,
                "total": total,
                "limit": limit,
                "offset": offset
            }
    except Exception as e:
        logger.error(f"Error listing managers: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.put("/{manager_id}", response_model=Manager)
def update_manager(manager_id: int, manager: ManagerUpdate):
    try:
        with get_db_cursor() as cursor:
            cursor.execute("SELECT id FROM managers WHERE id = %s;", (manager_id,))
            if not cursor.fetchone():
                raise HTTPException(status_code=404, detail="Manager not found")
            
            updates = []
            params = []
            if manager.name is not None:
                updates.append("name = %s")
                params.append(manager.name)
            if manager.role is not None:
                updates.append("role = %s")
                params.append(manager.role)
            
            if not updates:
                raise HTTPException(status_code=400, detail="No fields to update")
            
            params.append(manager_id)
            query = f"UPDATE managers SET {', '.join(updates)} WHERE id = %s RETURNING id, name, role;"
            cursor.execute(query, tuple(params))
            result = cursor.fetchone()
            cursor.connection.commit()
            return {"id": result[0], "name": result[1], "role": result[2]}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating manager: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.delete("/{manager_id}")
def delete_manager(manager_id: int):
    try:
        with get_db_cursor() as cursor:
            cursor.execute("DELETE FROM managers WHERE id = %s RETURNING id;", (manager_id,))
            if not cursor.fetchone():
                raise HTTPException(status_code=404, detail="Manager not found")
            cursor.connection.commit()
            return {"message": "Manager deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting manager: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
