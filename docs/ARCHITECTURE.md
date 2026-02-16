# MooMetrics Architecture Documentation

This document provides an in-depth overview of the MooMetrics system architecture, covering the backend and frontend components, data flow, and deployment processes.

## System Overview

MooMetrics is designed as a modular, scalable dashboard for smart farming. It utilizes a **FastAPI** backend for robust data management and AI integrations, and a **React/TypeScript** frontend for a responsive and intuitive user experience.

---

## Backend Architecture

The backend is a high-performance REST API built with **FastAPI**.

### Core Modules (`backend/app/`)

- **`api/v1/endpoints/`**:
    - `animals.py`: Livestock management (CRUD).
    - `auth.py`: JWT authentication, login, and refresh token logic.
    - `crops.py`: Crop rotation and planting management.
    - `farms.py`: Farm profile and location settings.
    - `tasks.py`: Operational task tracking.
- **`services/`**:
    - `ai_service.py`: Integration with OpenAI for agricultural predictions.
    - `weather_service.py`: Integration with OpenWeatherMap API.
- **`db/` & `crud/`**:
    - SQLAlchemy-based ORM layer.
    - Generic CRUD classes for standardized database operations.
- **`models/` & `schemas/`**:
    - `models/`: Database entity definitions.
    - `schemas/`: Pydantic models for request/response validation.

### Infrastructure & Security
- **Authentication**: JWT-based with Refresh Token Rotation for secure, persistent sessions.
- **Database**: SQLite (Development) / PostgreSQL (Production) managed via **Alembic** migrations.
- **Observability**: **Prometheus** instrumentation for metric collection and structured logging for request tracing.

---

## Frontend Architecture

The frontend is a modern SPA built with **React** and **TypeScript**, optimized with **Vite**.

### Feature-Based Structure (`frontend/src/features/`)

The application is modularized by feature, each containing its own components, hooks, and services:
- `livestock`: Animal health, tracking, and management.
- `crops`: Field planning and harvest tracking.
- `weather`: Real-time local weather and forecasts.
- `finance`: Basic farm bookkeeping and expense tracking.
- `equipment`: Inventory and maintenance logs.

### UI & Styling
- **Radix UI**: Accessible UI primitives for complex components (modals, dropdowns).
- **Tailwind CSS**: Utility-first CSS for rapid, consistent styling.
- **Lucide React**: Modern iconography.
- **State Management**: React Context API for global state (e.g., `AnimalContext`) and local state for component-specific logic.

---

## Data Flow & Integration

1. **Client Interaction**: User triggers an action in the React UI.
2. **API Layer**: Frontend makes authenticated requests to the FastAPI backend.
3. **Business Logic**: Backend service layer processes data, potentially calling external APIs (OpenAI/Weather).
4. **Persistence**: The CRUD layer executes database operations via SQLAlchemy.
5. **Real-time Updates**: The UI updates immediately upon successful API response, ensuring a seamless user experience.

---

## Build & Deployment

- **Containerization**: Both services are containerized using **Docker** and orchestrated via **Docker Compose**.
- **Frontend Build**: Vite compiles the TypeScript code into highly optimized chunks (vendor, charts, etc.).
- **Backend Build**: Python-based ASGI server (Uvicorn) with Gunicorn as a process manager for production.
