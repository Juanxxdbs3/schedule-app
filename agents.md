# Plan de implementación — horario-app

## Contexto

App personal para organizar el horario de clases por semestre a partir de un
pensum cargado en JSON. El usuario filtra materias por semestre/nombre/créditos,
las arrastra a una grilla (horas × días), la app valida créditos máximos y
choques de horario en tiempo real, y al finalizar el semestre cada materia se
marca como aprobada o perdida.

Diseñada para nacer simple (MVP) pero con arquitectura abierta a reglas de
negocio más complejas después (prerrequisitos que desbloquean materias, límite
de créditos por promedio, límite de 2 semestres para recuperar una materia
perdida, horarios que cambian cada semestre).

Lee siempre antes de programar:
- `docs/arquitectura.md` — estructura de carpetas, patrones (CSR + Strategy), contrato de API.
- `docs/modelo-mongo.md` — colecciones y campos.
- `docs/formato-pensum.json` — forma exacta del JSON que carga el usuario.

Stack: Node.js + Express + Mongoose + TypeScript (backend) · React + Vite +
TypeScript + dnd-kit + Zustand (frontend) · Vitest (testing) · MongoDB.

## Cómo usar este tablero

Cada tarea está pensada para ser pequeña y acotada a uno o pocos archivos.
Márcalas con `[x]` a medida que opencode las complete. Sigue el orden de las
fases — cada una depende de la anterior.

---

## Fase 0 — Infraestructura (agente: infra)

- [ ] Crear estructura de carpetas del monorepo: `backend/`, `frontend/`, `package.json` raíz con `workspaces`
- [ ] Crear `backend/.env.example` y `frontend/.env.example`
- [ ] Crear `backend/src/config/env.ts` (validación de `MONGO_URI`, `JWT_SECRET`, `PORT`, `CORS_ORIGIN`)
- [ ] Crear `backend/src/config/db.ts` (conexión Mongoose con pool)
- [ ] Configurar `backend/package.json` (scripts `dev`, `build`, `start`, `test`, `test:watch`) y `tsconfig.json`
- [ ] Inicializar `frontend/` con Vite (template `react-ts`)
- [ ] Crear `.gitignore` raíz (`node_modules`, `.env`, `dist`)

## Fase 1 — Backend: dominio y autenticación (agente: backend)

- [ ] Crear `domain/entities/` (Usuario, Materia, Pensum, Horario, Bloque — tipos puros)
- [ ] Crear `domain/interfaces/` (IUserRepository, IPensumRepository, IHorarioRepository)
- [ ] Crear `modules/auth/auth.repository.mongo.ts` (schema Mongoose de `users` + implementación de IUserRepository)
- [ ] Crear `modules/auth/auth.service.ts` (register, login con bcrypt + JWT)
- [ ] Crear `modules/auth/auth.controller.ts`
- [ ] Crear `modules/auth/auth.routes.ts`
- [ ] Crear `shared/middlewares/authGuard.ts`
- [ ] Crear `shared/errors/AppError.ts` (+ subclases NotFoundError, ValidationError)
- [ ] Crear `shared/middlewares/errorHandler.ts`
- [ ] Crear `app.ts` (CORS, cookie-parser, montar rutas de auth, error handler)
- [ ] Crear `server.ts` (bootstrap: `connectDB()` + `app.listen()`)

## Fase 2 — Backend: pensum (agente: backend)

- [ ] Crear `modules/pensum/pensum.repository.interface.ts`
- [ ] Crear `modules/pensum/pensum.repository.mongo.ts` (schema Mongoose con `materias` embebidas)
- [ ] Crear `modules/pensum/pensum.validation.ts` (validación contra `docs/formato-pensum.json`)
- [ ] Crear `modules/pensum/pensum.service.ts` (crear, listar, obtener, actualizar estado de materia)
- [ ] Crear `modules/pensum/pensum.controller.ts`
- [ ] Crear `modules/pensum/pensum.routes.ts`
- [ ] Montar rutas de pensum en `app.ts`

## Fase 3 — Backend: horario y strategies (agente: backend)

- [ ] Crear `modules/horario/strategies/ICreditLimitStrategy.ts` + `impl/SimpleCreditLimitStrategy.ts`
- [ ] Crear `modules/horario/strategies/IConflictDetectionStrategy.ts` + `impl/SimpleConflictDetectionStrategy.ts`
- [ ] Crear `modules/horario/horario.repository.interface.ts`
- [ ] Crear `modules/horario/horario.repository.mongo.ts`
- [ ] Crear `modules/horario/horario.service.ts` (crear horario, agregar/quitar bloque validando ambas strategies, finalizar horario actualizando el pensum)
- [ ] Crear `modules/horario/horario.controller.ts`
- [ ] Crear `modules/horario/horario.routes.ts`
- [ ] Montar rutas de horario en `app.ts`

## Fase 4 — Frontend: base y autenticación (agente: frontend)

- [ ] Configurar `shared/api/api.ts` (apiGet/apiPost/apiPatch/apiDelete, `credentials: 'include'`)
- [ ] Crear `features/auth/services/AuthService.ts`
- [ ] Crear `features/auth/components/LoginForm.tsx`, `RegisterForm.tsx`
- [ ] Crear `features/auth/hooks/useAuth.ts`
- [ ] Configurar routing base (React Router) con rutas protegidas

## Fase 5 — Frontend: pensum (agente: frontend)

- [ ] Crear `features/pensum/repositories/IPensumStorageRepository.ts`
- [ ] Crear `features/pensum/repositories/WebLocalStoragePensumRepository.ts`
- [ ] Crear `features/pensum/repositories/MobileStoragePensumRepository.ts` (stub)
- [ ] Crear `features/pensum/services/PensumService.ts` (cargar JSON, sincronizar con backend)
- [ ] Crear `features/pensum/components/FiltroPensum.tsx`
- [ ] Crear `features/pensum/components/PoolMaterias.tsx`
- [ ] Crear `features/pensum/components/MateriaBlock.tsx` (draggable)
- [ ] Pantalla de carga de pensum (input de archivo JSON + validación de forma)

## Fase 6 — Frontend: horario y drag-and-drop (agente: frontend)

- [ ] Instalar y configurar `@dnd-kit/core`
- [ ] Crear `features/horario/store/horarioStore.ts` (Zustand)
- [ ] Crear `features/horario/strategies/` (mismas reglas que backend, TS puro)
- [ ] Crear `features/horario/repositories/IHorarioStorageRepository.ts` + `WebLocalStorageHorarioRepository.ts`
- [ ] Crear `features/horario/services/HorarioService.ts` (sync con backend, debounce)
- [ ] Crear `features/horario/components/Grid.tsx`, `HourRow.tsx`, `DayColumn.tsx`
- [ ] Crear `features/horario/components/MateriaSlot.tsx` (draggable + estados visuales: normal/gris/choque)
- [ ] Crear `features/horario/components/ContadorCreditos.tsx`
- [ ] Pantalla de configuración de horario (unidad de hora, créditos máx., elegir pensum)
- [ ] Flujo de "finalizar semestre" (marcar aprobada/perdida por materia)

## Fase 7 — Testing (agente: testing)

- [ ] Crear Fakes: `FakeUserRepository`, `FakePensumRepository`, `FakeHorarioRepository`
- [ ] Tests unitarios: `auth.service`, `pensum.service`, `horario.service`
- [ ] Tests unitarios: `SimpleCreditLimitStrategy`, `SimpleConflictDetectionStrategy` (casos límite)
- [ ] Test de integración: `horario.repository.mongo` con `mongodb-memory-server`
- [ ] Test de integración: `auth.routes` con `supertest`
- [ ] Tests de componentes: `MateriaSlot`, `Grid` (testing-library)
- [ ] Test de `horarioStore` (acciones puras)

## Fase 8 — Integración final

- [ ] Probar flujo completo: registro → login → cargar pensum → crear horario → arrastrar materias → finalizar semestre
- [ ] Verificar CORS y cookies en flujo real navegador↔backend
- [ ] Escribir `README.md` con instrucciones de levantamiento local
