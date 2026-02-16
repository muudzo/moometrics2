# MooMetrics Development Guide

Welcome to the MooMetrics development guide. This document outlines the general development workflow, coding standards, and prerequisites for contributing to the project.

## Prerequisites

Ensure you have the following installed:
- **Node.js**: v18.0 or higher
- **Python**: v3.10 or higher
- **Docker & Docker Compose**: For containerized development
- **Git**: For version control

## Local Development Workflow

### 1. Repository Setup
```bash
git clone <repository-url>
cd moometrics-main
```

### 2. Backend Development
Detailed instructions in [backend/README.md](file:///Users/michaelnyemudzo/Downloads/moometrics-main/backend/README.md).
- Use a virtual environment.
- Run migrations before starting: `alembic upgrade head`.

### 3. Frontend Development
Detailed instructions in [frontend/README.md](file:///Users/michaelnyemudzo/Downloads/moometrics-main/frontend/README.md).
- Use `npm install` for dependencies.
- Use `npm run dev` for the Vite dev server.

## Coding Standards

### Backend (Python)
- Follow **PEP 8** style guidelines.
- Use type hints for all function arguments and return types.
- Ensure Pydantic schemas cover all input/output validation.
- Run `black` and `flake8` regularly.

### Frontend (React/TypeScript)
- Use **functional components** and **hooks**.
- Typed props and state using TypeScript interfaces.
- Prefer Tailwind CSS utility classes for styling.
- Organize code by features in `src/features/`.

## Testing

- **Backend**: Use `pytest` for unit and integration tests.
- **Frontend**: Vitest is configured for frontend unit tests.

## Version Control

- Use descriptive commit messages.
- Create feature branches for new work: `feature/name-of-feature`.
- Pull requests should be reviewed before merging.
