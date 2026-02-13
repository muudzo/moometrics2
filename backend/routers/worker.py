import logging
import psycopg2.errors
from fastapi import APIRouter, HTTPException, Query, Depends
from db import get_db_cursor
from schemas import WorkerCreate, Worker, WorkerUpdate, PaginatedResponse
from typing import List

router = APIRouter(prefix="/workers", tags=["workers"])
logger = logging.getLogger("workers")

@router.post("/", response_model=Worker)
def create_worker(worker: WorkerCreate):
    try:
        with get_db_cursor() as cursor:
            cursor.execute(
                "INSERT INTO workers (name, role) VALUES (%s, %s) RETURNING id, name, role;",
                (worker.name, worker.role)
            )
            result = cursor.fetchone()
            cursor.connection.commit()
            return {"id": result[0], "name": result[1], "role": result[2]}
    except psycopg2.errors.UniqueViolation:
        raise HTTPException(status_code=409, detail="Worker already exists")
    except Exception as e:
        logger.error(f"Error creating worker: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.get("/", response_model=PaginatedResponse[Worker])
def list_workers(limit: int = Query(10, le=100), offset: int = Query(0, ge=0)):
    try:
        with get_db_cursor() as cursor:
            # Get total count
            cursor.execute("SELECT COUNT(*) FROM workers;")
            total = cursor.fetchone()[0]
            
            # Get paginated items
            cursor.execute("SELECT id, name, role FROM workers LIMIT %s OFFSET %s;", (limit, offset))
            workers = cursor.fetchall()
            
            items = [{"id": w[0], "name": w[1], "role": w[2]} for w in workers]
            return {
                "items": items,
                "total": total,
                "limit": limit,
                "offset": offset
            }
    except Exception as e:
        logger.error(f"Error listing workers: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.get("/{worker_id}", response_model=Worker)
def get_worker(worker_id: int):
    with get_db_cursor() as cursor:
        cursor.execute("SELECT id, name, role FROM workers WHERE id = %s;", (worker_id,))
        result = cursor.fetchone()
        if not result:
            raise HTTPException(status_code=404, detail="Worker not found")
        return {"id": result[0], "name": result[1], "role": result[2]}

@router.put("/{worker_id}", response_model=Worker)
def update_worker(worker_id: int, worker: WorkerUpdate):
    try:
        with get_db_cursor() as cursor:
            # Check if exists
            cursor.execute("SELECT id FROM workers WHERE id = %s;", (worker_id,))
            if not cursor.fetchone():
                raise HTTPException(status_code=404, detail="Worker not found")
            
            # Prepare dynamic update
            updates = []
            params = []
            if worker.name is not None:
                updates.append("name = %s")
                params.append(worker.name)
            if worker.role is not None:
                updates.append("role = %s")
                params.append(worker.role)
            
            if not updates:
                raise HTTPException(status_code=400, detail="No fields to update")
            
            params.append(worker_id)
            query = f"UPDATE workers SET {', '.join(updates)} WHERE id = %s RETURNING id, name, role;"
            cursor.execute(query, tuple(params))
            result = cursor.fetchone()
            cursor.connection.commit()
            return {"id": result[0], "name": result[1], "role": result[2]}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating worker: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.delete("/{worker_id}")
def delete_worker(worker_id: int):
    try:
        with get_db_cursor() as cursor:
            cursor.execute("DELETE FROM workers WHERE id = %s RETURNING id;", (worker_id,))
            if not cursor.fetchone():
                raise HTTPException(status_code=404, detail="Worker not found")
            cursor.connection.commit()
            return {"message": "Worker deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting worker: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
