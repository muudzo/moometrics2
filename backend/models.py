import os
from sqlalchemy import create_engine, Column, Integer, String, Text, Date, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = f"postgresql://{os.getenv('DB_USER')}:{os.getenv('DB_PASS')}@{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}/{os.getenv('DB_NAME')}"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Worker(Base):
    __tablename__ = "workers"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True)
    role = Column(String(50), nullable=False, default="worker")
    
    records = relationship("FarmRecord", back_populates="worker", cascade="all, delete-orphan")

class Employee(Base):
    __tablename__ = "employees"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True)
    role = Column(String(50), nullable=False, default="employee")

class Manager(Base):
    __tablename__ = "managers"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True)
    role = Column(String(50), nullable=False, default="manager")

class FarmRecord(Base):
    __tablename__ = "farm_records"
    
    id = Column(Integer, primary_key=True, index=True)
    worker_id = Column(Integer, ForeignKey("workers.id", ondelete="CASCADE"), nullable=False)
    activity = Column(Text, nullable=False)
    date = Column(Date, server_default="CURRENT_DATE")
    
    worker = relationship("Worker", back_populates="records")

# Function to initialize database (for manual setup without Alembic initially if needed)
def init_db():
    Base.metadata.create_all(bind=engine)

if __name__ == "__main__":
    init_db()
    print("SQLAlchemy models synchronized.")
