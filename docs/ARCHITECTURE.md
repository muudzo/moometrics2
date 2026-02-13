# MooMetrics Architecture Documentation

This document provides a high-level overview of the MooMetrics system architecture, covering both the backend and frontend components, as well as the build and deployment processes.

## System Overview

MooMetrics is a smart farming dashboard designed to help farmers manage livestock, crops, and farm operations. It follows a classic client-server architecture with a React-based frontend and a FastAPI-based backend.

---

## Backend Architecture

The backend is built using **FastAPI**, providing a high-performance, asynchronous REST API.

### Core Structure (`backend/app/`)

The backend follows a modular structure to ensure scalability and maintainability:

- **`api/`**: Contains the API routers. The core functionality is versioned under `v1/`.
  - **`api/v1/endpoints/`**: Specific endpoint handlers for `auth`, `farms`, `animals`, and `crops`.
- **`core/`**: Centralized configuration (`config.py`), security utilities (`security.py`), and global constants.
- **`crud/`**: Database abstraction layer implementing Create, Read, Update, and Delete operations for models.
- **`db/`**: Database session management and base classes for SQLAlchemy.
- **`models/`**: SQLAlchemy models representing the database schema (e.g., `User`, `Farm`, `Animal`, `Crop`).
- **`schemas/`**: Pydantic models for data validation and serialization (request and response bodies).
- **`services/`**: Business logic layer that orchestrates CRUD operations and other external services (e.g., weather data, predictions).
- **`routers/`**: Utility and legacy routers like `weather` and `predictions`.

### Key Features
- **Authentication**: JWT-based authentication with refresh token rotation.
- **Database**: SQLite for local development, with **Alembic** used for schema migrations.
- **Middleware**: Custom middleware for CORS and request logging (tracking process time and request IDs).
- **Error Handling**: A global exception handler ensures consistent error responses across the API.

---

## Frontend Architecture

The frontend is a modern SPA built with **React** and **TypeScript**, powered by **Vite** for fast development and optimized builds.

### Core Structure (`frontend/src/`)

The frontend is organized for modularity and reusability:

- **`features/`**: Feature-specific logic, components, and hooks (e.g., `livestock`, `weather`).
- **`components/`**: Shared UI components, mostly built using **Radix UI** primitives and styled with **Tailwind CSS**.
- **`context/`**: Global state management using the React Context API (e.g., `AnimalContext`).
- **`constants/`**: Shared constants and configuration values.
- **`styles/`**: Global CSS and styling themes.

### Design System
- **Radix UI**: Used for accessibility-first, unstyled components (dialogs, select, etc.).
- **Tailwind CSS**: Used for utility-first styling, ensuring a consistent and responsive design.
- **Lucide React**: Used for iconography.

---

## Build and Deployment

### Frontend Build
The frontend uses **Vite** with the **SWC** plugin for extremely fast builds.

- **Build Tool**: `vite build`
- **Output Directory**: `frontend/build/`
- **Optimization**:
  - **Manual Chunking**: The build is optimized by splitting large dependencies into separate chunks (e.g., `vendor`, `charts`, `icons`, `radix-ui`).
  - **Target**: `esnext` for modern browser compatibility.

### Backend Build
The backend is a standard Python application.

- **Dependencies**: Managed via `requirements.txt`.
- **Environment**: Configuration is handled through `.env` files and Pydantic Settings.
- **Migrations**: `alembic upgrade head` is used to sync the database schema.

---

## Data Flow

1. **User Interaction**: Users interact with the React frontend through a web browser.
2. **API Requests**: The frontend sends HTTP requests to the FastAPI backend, including JWT tokens for authenticated routes.
3. **Business Logic**: The backend processes requests, validates data using Pydantic, and executes business logic in the `services` layer.
4. **Database Interaction**: The `crud` layer interacts with the SQLite database using SQLAlchemy.
5. **Response**: The backend returns a JSON response, which the frontend uses to update the UI state.
