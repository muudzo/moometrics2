import logging
import psycopg2.errors
from fastapi import APIRouter, HTTPException, Query
from db import get_db_cursor
from schemas import EmployeeCreate, Employee, EmployeeUpdate, PaginatedResponse
from typing import List

router = APIRouter(prefix="/employees", tags=["employees"])
logger = logging.getLogger("employees")

@router.post("/", response_model=Employee)
def create_employee(employee: EmployeeCreate):
    try:
        with get_db_cursor() as cursor:
            cursor.execute(
                "INSERT INTO employees (name, role) VALUES (%s, %s) RETURNING id, name, role;",
                (employee.name, employee.role)
            )
            result = cursor.fetchone()
            cursor.connection.commit()
            return {"id": result[0], "name": result[1], "role": result[2]}
    except psycopg2.errors.UniqueViolation:
        raise HTTPException(status_code=409, detail="Employee already exists")
    except Exception as e:
        logger.error(f"Error creating employee: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.get("/", response_model=PaginatedResponse[Employee])
def list_employees(limit: int = Query(10, le=100), offset: int = Query(0, ge=0)):
    try:
        with get_db_cursor() as cursor:
            cursor.execute("SELECT COUNT(*) FROM employees;")
            total = cursor.fetchone()[0]
            
            cursor.execute("SELECT id, name, role FROM employees LIMIT %s OFFSET %s;", (limit, offset))
            employees = cursor.fetchall()
            
            items = [{"id": e[0], "name": e[1], "role": e[2]} for e in employees]
            return {
                "items": items,
                "total": total,
                "limit": limit,
                "offset": offset
            }
    except Exception as e:
        logger.error(f"Error listing employees: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.put("/{employee_id}", response_model=Employee)
def update_employee(employee_id: int, employee: EmployeeUpdate):
    try:
        with get_db_cursor() as cursor:
            cursor.execute("SELECT id FROM employees WHERE id = %s;", (employee_id,))
            if not cursor.fetchone():
                raise HTTPException(status_code=404, detail="Employee not found")
            
            updates = []
            params = []
            if employee.name is not None:
                updates.append("name = %s")
                params.append(employee.name)
            if employee.role is not None:
                updates.append("role = %s")
                params.append(employee.role)
            
            if not updates:
                raise HTTPException(status_code=400, detail="No fields to update")
            
            params.append(employee_id)
            query = f"UPDATE employees SET {', '.join(updates)} WHERE id = %s RETURNING id, name, role;"
            cursor.execute(query, tuple(params))
            result = cursor.fetchone()
            cursor.connection.commit()
            return {"id": result[0], "name": result[1], "role": result[2]}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating employee: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.delete("/{employee_id}")
def delete_employee(employee_id: int):
    try:
        with get_db_cursor() as cursor:
            cursor.execute("DELETE FROM employees WHERE id = %s RETURNING id;", (employee_id,))
            if not cursor.fetchone():
                raise HTTPException(status_code=404, detail="Employee not found")
            cursor.connection.commit()
            return {"message": "Employee deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting employee: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
