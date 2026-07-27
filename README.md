# horario-app

Personal semester schedule organizer. Drag subjects from a pensum into a grid
(day × hour), validate credit limits and schedule conflicts in real time, and
finalize the semester to mark subjects as passed/failed.

## Stack

| Layer     | Tech                                    |
|-----------|-----------------------------------------|
| Frontend  | React 19 + Vite + TypeScript + dnd-kit + Zustand + Tailwind v4 |
| Backend   | Node.js + Express + Mongoose + TypeScript |
| Database  | MongoDB (local)                         |
| Testing   | Vitest                                  |

## Project structure

```
horario-app/
  backend/          Express API (port 4000)
    src/
      domain/         Pure TS entities & interfaces
      modules/        Feature modules (auth, pensum, horario)
      shared/         Middleware, errors
      config/         Env, DB connection
      __tests__/fakes/ In-memory fakes for unit tests
  frontend/         Vite + React (port 5173)
    src/
      features/       Feature modules (auth, pensum, horario)
      shared/         Shared components (Modal) & utilities
  docs/             Architecture, data model, pensum format
```

## Quick start

### Prerequisites

- Node.js >= 18
- MongoDB running locally on port 27017 (or configure via `.env`)

### Setup

```bash
# 1. Install dependencies (root installs both workspaces)
npm install

# 2. Configure environment
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 3. Start MongoDB (if not running as a service)
mongod --dbpath /path/to/data

# 4. Start dev servers (backend + frontend concurrently)
npm run dev
```

### Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both backend + frontend in dev mode |
| `npm run build` | Build both projects |
| `npm test` | Run all tests (backend + frontend) |
| `npm run lint` | Run linter (if configured) |

## Full flow walkthrough

1. Open `http://localhost:5173` in a browser.
2. Register a new user (username, email, password).
3. Upload a pensum JSON file (format: `docs/formato-pensum.json`).
4. Go to the pensum page, click "Crear horario", set max credits and slot
   duration.
5. Drag subjects from the sidebar into the grid. Conflicts and credit limits
   are validated in real time. Click a placed block to edit its display name,
   professor, or room.
6. Switch to "En curso" mode, mark each subject as approved (✓) or failed (✗).
7. Click "Finalizar semestre".

## API endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST   | /api/auth/register | No | Register user |
| POST   | /api/auth/login | No | Login (sets httpOnly cookie) |
| GET    | /api/auth/me | Yes | Current user |
| POST   | /api/pensums | Yes | Upload pensum |
| GET    | /api/pensums | Yes | List user pensums |
| GET    | /api/pensums/:id | Yes | Get pensum by id |
| PATCH  | /api/pensums/:id/materias/:codigo/estado | Yes | Update materia state |
| DELETE | /api/pensums/:id | Yes | Delete pensum |
| POST   | /api/horarios | Yes | Create horario |
| GET    | /api/horarios | Yes | List horarios |
| GET    | /api/horarios/:id | Yes | Get horario with bloques |
| PUT    | /api/horarios/:id/bloques | Yes | Replace all bloques |
| PATCH  | /api/horarios/:id/bloques | Yes | Add single bloque |
| DELETE | /api/horarios/:id/bloques/:bloqueId | Yes | Remove bloque |
| PATCH  | /api/horarios/:id/resultados | Yes | Mark subject result |
| PATCH  | /api/horarios/:id/finalizar | Yes | Finalize semester |
| DELETE | /api/horarios/:id | Yes | Delete horario |

## Testing

```bash
# All tests
npm test

# Backend only (47 tests)
cd backend && npx vitest run

# Frontend only (17 tests)
cd frontend && npx vitest run
```

### Test breakdown

| Suite | Tests |
|-------|-------|
| Backend unit: auth.service | 8 |
| Backend unit: pensum.service | 9 |
| Backend unit: horario.service | 19 |
| Backend unit: saveBloques | 7 |
| Backend unit: strategies | 4 |
| Frontend unit: strategies | 9 |
| Frontend unit: generarFilasHora | 8 |
| **Total** | **64** |
