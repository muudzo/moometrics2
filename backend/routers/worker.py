from fastapi import APIRouter, HTTPException
from db import get_cursor, conn
from schemas import WorkerCreate, Worker
from typing import List

router = APIRouter(prefix="/workers", tags=["workers"])

@router.post("/", response_model=Worker)
def create_worker(worker: WorkerCreate):
    cursor = get_cursor()
    cursor.execute(
        "INSERT INTO workers (name, role) VALUES (%s, %s) RETURNING id, name, role;",
        (worker.name, worker.role)
    )
    result = cursor.fetchone()
    conn.commit()
    cursor.close()
    return {"id": result[0], "name": result[1], "role": result[2]}

@router.get("/", response_model=List[Worker])
def list_workers():
    cursor = get_cursor()
    cursor.execute("SELECT id, name, role FROM workers;")
    workers = cursor.fetchall()
    cursor.close()
    return [{"id": w[0], "name": w[1], "role": w[2]} for w in workers]
