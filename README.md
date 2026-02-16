# MooMetrics Smart Farming Dashboard

MooMetrics is a comprehensive smart farming management system designed to help modern farmers manage their livestock, crops, farm operations, and equipment with ease. It leverages AI-powered insights and real-time weather data to optimize farming decisions.

## Project Structure

This project is a full-stack application organized into three main components:

- **[frontend/](file:///Users/michaelnyemudzo/Downloads/moometrics-main/frontend/README.md)**: A modern React-based single-page application built with TypeScript, Vite, Radix UI, and Tailwind CSS.
- **[backend/](file:///Users/michaelnyemudzo/Downloads/moometrics-main/backend/README.md)**: A high-performance FastAPI backend service providing RESTful APIs, JWT authentication, and AI/Weather service integrations.
- **[docs/](file:///Users/michaelnyemudzo/Downloads/moometrics-main/docs/ARCHITECTURE.md)**: In-depth technical documentation covering system architecture and development guidelines.

## Quick Start (Docker Compose)

The easiest way to get the entire system running is using Docker Compose:

1. Ensure you have Docker and Docker Compose installed.
2. From the root directory, run:
   ```bash
   docker-compose up --build
   ```
3. The frontend will be available at `http://localhost:5173` and the backend API at `http://localhost:8000`.

## Manual Setup

For detailed setup instructions for individual components, please refer to their respective README files:

- [Frontend Setup Guide](file:///Users/michaelnyemudzo/Downloads/moometrics-main/frontend/README.md)
- [Backend Setup Guide](file:///Users/michaelnyemudzo/Downloads/moometrics-main/backend/README.md)

## Documentation

- **[Architecture](file:///Users/michaelnyemudzo/Downloads/moometrics-main/docs/ARCHITECTURE.md)**: Detailed overview of the system design and tech stack.
- **[Development Guide](file:///Users/michaelnyemudzo/Downloads/moometrics-main/docs/DEVELOPMENT.md)**: Information for contributors on development workflows.
- **[Setup Guide](file:///Users/michaelnyemudzo/Downloads/moometrics-main/docs/SETUP.md)**: Detailed setup steps for various environments.
- **[API Keys Guide](file:///Users/michaelnyemudzo/Downloads/moometrics-main/docs/API_KEY_GUIDE.md)**: How to configure external services like OpenWeather and OpenAI.
