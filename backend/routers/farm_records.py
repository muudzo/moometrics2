import logging
from fastapi import APIRouter, HTTPException, Query
from db import get_db_cursor
from schemas import FarmRecordCreate, FarmRecord, FarmRecordUpdate, PaginatedResponse
from typing import List

router = APIRouter(prefix="/farm-records", tags=["farm_records"])
logger = logging.getLogger("farm_records")

@router.post("/", response_model=FarmRecord)
def create_farm_record(record: FarmRecordCreate):
    try:
        with get_db_cursor() as cursor:
            cursor.execute(
                "INSERT INTO farm_records (worker_id, activity, date) VALUES (%s, %s, COALESCE(%s, CURRENT_DATE)) RETURNING id, worker_id, activity, date;",
                (record.worker_id, record.activity, record.date)
            )
            result = cursor.fetchone()
            cursor.connection.commit()
            return {"id": result[0], "worker_id": result[1], "activity": result[2], "date": result[3]}
    except Exception as e:
        logger.error(f"Error creating farm record: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.get("/", response_model=PaginatedResponse[FarmRecord])
def list_farm_records(limit: int = Query(10, le=100), offset: int = Query(0, ge=0)):
    try:
        with get_db_cursor() as cursor:
            cursor.execute("SELECT COUNT(*) FROM farm_records;")
            total = cursor.fetchone()[0]
            
            cursor.execute("SELECT id, worker_id, activity, date FROM farm_records LIMIT %s OFFSET %s;", (limit, offset))
            records = cursor.fetchall()
            
            items = [{"id": r[0], "worker_id": r[1], "activity": r[2], "date": r[3]} for r in records]
            return {
                "items": items,
                "total": total,
                "limit": limit,
                "offset": offset
            }
    except Exception as e:
        logger.error(f"Error listing farm records: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.put("/{record_id}", response_model=FarmRecord)
def update_farm_record(record_id: int, record: FarmRecordUpdate):
    try:
        with get_db_cursor() as cursor:
            cursor.execute("SELECT id FROM farm_records WHERE id = %s;", (record_id,))
            if not cursor.fetchone():
                raise HTTPException(status_code=404, detail="Farm record not found")
            
            updates = []
            params = []
            if record.worker_id is not None:
                updates.append("worker_id = %s")
                params.append(record.worker_id)
            if record.activity is not None:
                updates.append("activity = %s")
                params.append(record.activity)
            if record.date is not None:
                updates.append("date = %s")
                params.append(record.date)
            
            if not updates:
                raise HTTPException(status_code=400, detail="No fields to update")
            
            params.append(record_id)
            query = f"UPDATE farm_records SET {', '.join(updates)} WHERE id = %s RETURNING id, worker_id, activity, date;"
            cursor.execute(query, tuple(params))
            result = cursor.fetchone()
            cursor.connection.commit()
            return {"id": result[0], "worker_id": result[1], "activity": result[2], "date": result[3]}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating farm record: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.delete("/{record_id}")
def delete_farm_record(record_id: int):
    try:
        with get_db_cursor() as cursor:
            cursor.execute("DELETE FROM farm_records WHERE id = %s RETURNING id;", (record_id,))
            if not cursor.fetchone():
                raise HTTPException(status_code=404, detail="Farm record not found")
            cursor.connection.commit()
            return {"message": "Farm record deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting farm record: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
