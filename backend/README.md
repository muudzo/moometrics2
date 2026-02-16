# MooMetrics Backend API

Python backend for MooMetrics agricultural management system, providing a robust REST API for farm, livestock, and crop management, integrated with AI predictions and weather data.

## Features

- **Livestock Management**: CRUD operations for animals, health tracking, and records.
- **Farm & Crop Management**: Manage farm profiles, crop rotations, and planting schedules.
- **AI Predictions**: OpenAI-powered planting and harvest recommendations.
- **Weather API**: Location-based weather data from OpenWeatherMap.
- **Security**: JWT-based authentication with refresh token rotation.
- **Observability**: Prometheus metrics and structured logging.

## Tech Stack

- **FastAPI**: Modern, high-performance web framework.
- **SQLAlchemy**: SQL toolkit and ORM.
- **Alembic**: Database migrations.
- **OpenAI**: AI predictions logic.
- **httpx**: Async HTTP client for external integrations.
- **Pydantic**: Data validation and settings management.

## Setup

### 1. Install Dependencies

```bash
cd backend
python -m venv venv
# On Windows: venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
# Edit .env and add your API keys/DB credentials
```

### 3. Run Migrations

```bash
alembic upgrade head
```

### 4. Run the Server

```bash
uvicorn app.main:app --reload --port 8000
```

## API Endpoints (v1)

All core endpoints are prefixed with `/api/v1`.

### Animals
- **GET** `/api/v1/animals`: List all animals.
- **POST** `/api/v1/animals`: Register a new animal.

### Farms
- **GET** `/api/v1/farms`: Get farm details.

### Auth
- **POST** `/api/v1/auth/login`: Authenticate and get tokens.

### Weather (Utility)
- **GET** `/weather?lat={lat}&lon={lon}`: Get current weather.

### Predictions (Utility)
- **POST** `/predictions/planting`: Get AI planting advice.

## API Documentation

Interactive documentation:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Project Structure

```
backend/
├── app/
│   ├── api/v1/endpoints/    # API Route handlers
│   ├── core/              # Config, Security
│   ├── crud/              # DB Operations
│   ├── models/            # SQLAlchemy Models
│   ├── schemas/           # Pydantic Schemas
│   ├── services/          # Business logic (AI, Weather)
│   └── main.py            # Application entry point
├── alembic/               # DB Migrations
├── requirements.txt
└── README.md
```

## Development

### Running Tests

```bash
# Install test dependencies
pip install pytest pytest-asyncio httpx

# Run tests
pytest
```

### Code Quality

```bash
# Format code
black app/

# Lint
flake8 app/
```

## Deployment

For production deployment:

1. Set environment variables in your hosting platform
2. Use a production ASGI server (Uvicorn with Gunicorn)
3. Enable HTTPS
4. Configure proper CORS origins

Example production command:

```bash
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

## License

MIT
