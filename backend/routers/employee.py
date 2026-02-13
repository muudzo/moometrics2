from fastapi import APIRouter, HTTPException
from db import get_cursor, conn
from schemas import EmployeeCreate, Employee
from typing import List

router = APIRouter(prefix="/employees", tags=["employees"])

@router.post("/", response_model=Employee)
def create_employee(employee: EmployeeCreate):
    cursor = get_cursor()
    cursor.execute(
        "INSERT INTO employees (name, role) VALUES (%s, %s) RETURNING id, name, role;",
        (employee.name, employee.role)
    )
    result = cursor.fetchone()
    conn.commit()
    cursor.close()
    return {"id": result[0], "name": result[1], "role": result[2]}

@router.get("/", response_model=List[Employee])
def list_employees():
    cursor = get_cursor()
    cursor.execute("SELECT id, name, role FROM employees;")
    employees = cursor.fetchall()
    cursor.close()
    return [{"id": e[0], "name": e[1], "role": e[2]} for e in employees]
