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

## Quick start (development)

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

Open `http://localhost:5173` in a browser.

### Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both backend + frontend in dev mode |
| `npm run build` | Build both projects for production |
| `npm start` | Run production server (after build) |
| `npm test` | Run all tests (backend + frontend) |
| `npm run lint` | Run linter (if configured) |

## Production deployment

The project is designed to run as a **single service** in production — Express
serves both the API and the compiled frontend assets.

```bash
# 1. Build both projects
npm run build

# 2. Set NODE_ENV=production in backend/.env
#    (Backend will serve frontend/dist/ as static files)

# 3. Start the production server
NODE_ENV=production node backend/dist/server.js
```

The server listens on the port defined by the `PORT` env var (default 4000).
Open `http://localhost:4000` — the app and API share the same origin, so no
CORS issues.

### Environment variables (backend/.env)

| Variable       | Required | Default                  | Description                         |
|----------------|----------|--------------------------|-------------------------------------|
| `MONGO_URI`    | Yes      | —                        | MongoDB connection string           |
| `JWT_SECRET`   | Yes      | —                        | Secret for signing JWTs             |
| `PORT`         | No       | `4000`                   | HTTP port (Render injects this)     |
| `CORS_ORIGIN`  | No       | `http://localhost:5173`  | Allowed CORS origin (dev only)      |
| `NODE_ENV`     | No       | —                        | Set to `production` for deployment  |

### Cookie security

In production (`NODE_ENV=production`), the JWT cookie is set with `secure: true`
(requires HTTPS). Render serves all traffic over HTTPS, so this is both safe and
necessary.

## Full flow walkthrough

1. Open `http://localhost:5173` (dev) or your deployed URL (prod).
2. Register a new user (username, email, password).
3. Load a pensum: upload a `.json` file (format: `docs/formato-pensum.json`) or paste
   the JSON. If you don't have one, click "¿Cómo genero el JSON? Ver prompt", copy the
   prompt, give it to an AI together with your study plan, and paste back the result.
   The app validates the whole pensum and shows a summary before saving it.
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
| POST   | /api/pensums/:id/materias | Yes | Add a single materia |
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

# Backend only (80 tests)
cd backend && npx vitest run

# Frontend only (65 tests)
cd frontend && npx vitest run
```

### Test breakdown

| Suite | Tests |
|-------|-------|
| Backend unit: auth.service | 8 |
| Backend unit: pensum.service | 15 |
| Backend unit: pensum.validation | 21 |
| Backend unit: horario.service | 25 |
| Backend unit: horario.service.saveBloques | 7 |
| Backend unit: creditLimitStrategy | 4 |
| **Backend subtotal** | **80** |
| Frontend unit: horarioStore | 22 |
| Frontend unit: validarPensumJson | 19 |
| Frontend unit: promptGenerarPensum | 2 |
| Frontend unit: generarFilasHora | 8 |
| Frontend unit: exportHorarioSvg | 5 |
| Frontend unit: conflictDetectionStrategy | 5 |
| Frontend unit: creditLimitStrategy | 4 |
| **Frontend subtotal** | **65** |
| **Total** | **145** |
