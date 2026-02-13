from fastapi import APIRouter, HTTPException
from db import get_cursor, conn
from schemas import FarmRecordCreate, FarmRecord
from typing import List

router = APIRouter(prefix="/farm-records", tags=["farm_records"])

@router.post("/", response_model=FarmRecord)
def create_farm_record(record: FarmRecordCreate):
    cursor = get_cursor()
    cursor.execute(
        "INSERT INTO farm_records (worker_id, activity, date) VALUES (%s, %s, COALESCE(%s, CURRENT_DATE)) RETURNING id, worker_id, activity, date;",
        (record.worker_id, record.activity, record.date)
    )
    result = cursor.fetchone()
    conn.commit()
    cursor.close()
    return {"id": result[0], "worker_id": result[1], "activity": result[2], "date": result[3]}

@router.get("/", response_model=List[FarmRecord])
def list_farm_records():
    cursor = get_cursor()
    cursor.execute("SELECT id, worker_id, activity, date FROM farm_records;")
    records = cursor.fetchall()
    cursor.close()
    return [{"id": r[0], "worker_id": r[1], "activity": r[2], "date": r[3]} for r in records]
