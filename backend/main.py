from fastapi import FastAPI
from routers import worker, employee, manager, farm_records

app = FastAPI(
    title="Farm Records Backend",
    description="Backend for farm management with roles and functional CRUD",
    version="1.0.0"
)

app.include_router(worker.router)
app.include_router(employee.router)
app.include_router(manager.router)
app.include_router(farm_records.router)

@app.get("/")
def root():
    return {"message": "Farm Records API is running."}

@app.get("/health")
def health():
    return {"status": "healthy"}
