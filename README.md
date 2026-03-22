# MaxTime

Real-time latency monitor for the Claude API. Tracks time-to-first-token (TTFT) across models, measures network latency, and checks the Anthropic status page — all on a live dashboard.

## What It Does

- Measures **TTFT** for Claude Opus, Sonnet, and Haiku every 2 minutes
- Probes **DNS, TCP connect, and TLS/TTFB** to `api.anthropic.com`
- Checks the **Anthropic status page** for incidents and degradations
- Displays everything on a **live dashboard** with interactive charts
- CLI tool with **terminal heatmap** for finding the best time to code

## Stack

| Layer | Tech |
|-------|------|
| Backend | Python, FastAPI, Motor (async MongoDB) |
| Frontend | Next.js 16, React 19, Recharts, Tailwind CSS, shadcn/ui |
| Database | MongoDB 8.0 |
| Tooling | Ruff, Pyright, ESLint, Prettier, pre-commit |

## Quick Start

### Prerequisites

- Python 3.10+
- Node.js 20+
- MongoDB (via Docker or local install)

### 1. Start MongoDB

```bash
docker compose up mongo -d
```

### 2. Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env  # or create .env with your ANTHROPIC_API_KEY
uvicorn app.main:app --port 8001 --reload
```

### 3. Seed Data (optional)

```bash
cd backend
python seed.py
```

This populates 30 days of simulated latency data across 8 model variants.

### 4. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Docker Compose (full stack)

```bash
docker compose up --build
```

This starts MongoDB, the API server, and the frontend. Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

### Backend (`backend/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | — | Required for TTFT measurements |
| `MONGO_URL` | `mongodb://localhost:27017` | MongoDB connection string |
| `MONGO_DB` | `maxtime` | Database name |
| `MONITOR_INTERVAL_SECONDS` | `120` | Seconds between measurement cycles |

### Frontend (`frontend/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `API_URL` | `http://localhost:8000` | Backend API URL for proxy rewrites |

## CLI Monitor

The CLI tool connects to the same MongoDB and provides a terminal-based heatmap.

```bash
cd backend

# Single measurement cycle
python -m cli.monitor

# Daemon mode (every 5 minutes)
python -m cli.monitor --daemon --interval 5

# Heatmap analysis
python -m cli.monitor --analyze
python -m cli.monitor --analyze --days 3
```

## Project Structure

```
maxtime/
  backend/
    app/
      core/           # Shared config and probe functions
      services/       # Business logic (monitor cycle, metrics queries)
      routes.py       # API endpoints
      schemas.py      # Pydantic models
      db.py           # MongoDB connection
      main.py         # FastAPI app
    cli/              # CLI monitor with heatmap
    seed.py           # Database seeder
  frontend/
    src/
      app/            # Next.js pages
      components/     # Dashboard components
      hooks/          # Data fetching hook
      lib/            # Utilities, API client, color logic
  docker-compose.yml  # Full stack orchestration
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/models` | List monitored models with measurement counts |
| `POST` | `/api/metrics` | Fetch TTFT and network metrics for a time range |
| `GET` | `/health` | Health check |

## License

MIT
