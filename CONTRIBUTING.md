# Contributing to MaxTime

Thanks for your interest in contributing! Here's how to get set up and submit changes.

## Development Setup

### Backend

```bash
cd backend
pip install -r requirements.txt
pip install ruff pyright pre-commit

# Install pre-commit hooks
pre-commit install

# Start MongoDB
docker compose -f ../docker-compose.yml up mongo -d

# Seed test data
python seed.py

# Run the server
uvicorn app.main:app --port 8001 --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Code Quality

### Backend

```bash
cd backend

# Lint
ruff check app/ cli/ seed.py

# Format
ruff format app/ cli/ seed.py

# Type check
pyright app/ cli/ seed.py
```

### Frontend

```bash
cd frontend

# All checks (typecheck + lint + format)
npm run check

# Individual
npm run typecheck    # TypeScript
npm run lint         # ESLint
npm run format:check # Prettier

# Auto-fix
npm run lint:fix
npm run format
```

## Project Conventions

### Backend

- **Python 3.10+** — avoid 3.11+ features like `datetime.UTC`
- **Ruff** for linting and formatting (config in `pyproject.toml`)
- **Pyright** in basic mode for type checking
- **Typed returns** — use dataclasses or `TypedDict`, not bare `dict` or `tuple`
- **Async** — all DB operations use motor's async API
- **Shared probes** live in `app/core/probes.py` — both the backend service and CLI import from here

### Frontend

- **TypeScript strict mode** — no `any` types
- **Prettier + Tailwind plugin** for formatting (config in `.prettierrc.json`)
- **shadcn/ui** components in `src/components/ui/` — don't modify these directly, use `npx shadcn add`
- **Custom components** go in `src/components/`
- **Hooks** go in `src/hooks/`
- **Pure utilities** go in `src/lib/`
- **State ownership** — UI-local state (popovers, form inputs) belongs in the component, not the data hook

## Submitting Changes

1. Create a branch from `master`
2. Make your changes
3. Ensure all checks pass (`ruff check`, `pyright`, `npm run check`)
4. Push and open a pull request
5. Describe what changed and why in the PR description

## Adding a New Model

1. Add the model ID to `MODELS` in `backend/app/core/config.py`
2. Add a short name to `MODEL_SHORT` in the same file
3. The frontend picks up new models automatically from the `/api/models` endpoint

## Adding a New API Endpoint

1. Add the Pydantic schema to `backend/app/schemas.py`
2. Add the query logic to `backend/app/services/metrics.py`
3. Add the route handler to `backend/app/routes.py`
4. Add the TypeScript interface and fetch function to `frontend/src/lib/api.ts`
