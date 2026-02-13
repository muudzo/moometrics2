from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, DateTime, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import uuid


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    farms = relationship("Farm", back_populates="owner")
    refresh_tokens = relationship("RefreshToken", back_populates="user")


class Farm(Base):
    __tablename__ = "farms"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    owner_id = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    is_deleted = Column(Boolean, default=False, nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    owner = relationship("User", back_populates="farms")
    animals = relationship("Animal", back_populates="farm")
    crops = relationship("Crop", back_populates="farm")

    __table_args__ = (
        Index('ix_farms_owner_id', 'owner_id'),
    )


class Animal(Base):
    __tablename__ = "animals"

    id = Column(Integer, primary_key=True, index=True)
    tag_number = Column(String, index=True, nullable=False)
    type = Column(String, nullable=False)
    health_status = Column(String, nullable=False)
    vaccination_status = Column(String, nullable=False)
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    is_deleted = Column(Boolean, default=False, nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    farm = relationship("Farm", back_populates="animals")

    __table_args__ = (
        Index('ix_animals_farm_id', 'farm_id'),
        Index('ix_animals_farm_tag', 'farm_id', 'tag_number'),
    )


class Crop(Base):
    __tablename__ = "crops"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    planting_date = Column(DateTime(timezone=True), nullable=False)
    harvest_date = Column(DateTime(timezone=True), nullable=True)
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=False)
    is_deleted = Column(Boolean, default=False, nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    farm = relationship("Farm", back_populates="crops")

    __table_args__ = (
        Index('ix_crops_farm_id', 'farm_id'),
    )


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    token = Column(String, unique=True, index=True, nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    revoked = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="refresh_tokens")
