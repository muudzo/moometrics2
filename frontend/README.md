# MooMetrics Frontend

A modern, responsive smart farming dashboard built with React and TypeScript.

## Features

- **Dashboard**: High-level overview of farm health, weather, and tasks.
- **Livestock Management**: Detailed tracking of animal health, records, and statistics.
- **Crop Planning**: Visual management of fields and planting timelines.
- **Weather Integration**: Localized weather alerts and agricultural forecasts.
- **Equipment Logs**: Inventory tracking and maintenance scheduling.

## Tech Stack

- **React**: UI library.
- **TypeScript**: Static typing for robust code.
- **Vite**: Ultra-fast build tool and dev server.
- **Tailwind CSS**: Utility-first styling.
- **Radix UI**: Accessible UI primitives.
- **Lucide React**: Icon library.

## Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Environment Configuration

Create a `.env` file in the `frontend` directory:

```env
VITE_API_URL=http://localhost:8000
```

### 3. Run Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

## Project Structure

```
frontend/
├── src/
│   ├── components/     # Shared UI components
│   ├── context/        # Global React Context providers
│   ├── features/       # Feature-based modules (Livestock, Crops, etc.)
│   ├── styles/         # Global styles and Tailwind config
│   ├── App.tsx         # Main application component
│   └── main.tsx        # Entry point
├── public/             # Static assets
├── index.html
├── package.json
└── vite.config.ts
```

## Building for Production

To create an optimized production build:

```bash
npm run build
```

The output will be in the `dist` directory (configured as `build` in some environments).
