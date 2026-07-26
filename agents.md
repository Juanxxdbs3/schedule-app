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

## Entidades de dominio (`domain/entities/`)

Estas son las interfaces TypeScript exactas que la Fase 1 debe crear (sin
`ObjectId` de Mongoose — son tipos puros que usan Service y Controller; la
conversión a/desde documentos de Mongoose vive solo en el Repository):

```ts
type EstadoMateria = 'activo' | 'matriculado' | 'cursado' | 'en_espera';
type EstadoHorario = 'en_progreso' | 'finalizado';
type DiaSemana = 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo';

interface Usuario {
  id: string;
  username: string;
  email: string;
  createdAt: Date;
}

interface Materia {
  codigo: string;
  nombre: string;
  creditos: number;
  semestre: number;
  requiere: string[];       // códigos de prerrequisitos
  estado: EstadoMateria;
}

interface Pensum {
  id: string;
  userId: string;
  nombre: string;
  materias: Materia[];
  createdAt: Date;
  updatedAt: Date;
}

interface Bloque {
  materiaCodigo: string;
  dia: DiaSemana;
  horaInicio: string;       // "07:00"
  horaFin: string;          // "09:30"
}

interface Horario {
  id: string;
  userId: string;
  pensumId: string;
  semestreLabel: string;
  maxCreditos: number;
  unidadHoraMinutos: number;
  estado: EstadoHorario;
  bloques: Bloque[];
  createdAt: Date;
  finalizadoAt: Date | null;
}
```

El frontend reutiliza estos mismos tipos (copiados a `shared/types/domain.ts`,
no importados directo del backend — son dos proyectos separados en el MVP).

## Flujo end-to-end (qué mensaje se dispara en qué momento)

**Flujo 1 — Registro y sesión**
1. `POST /api/auth/register` → crea usuario.
2. `POST /api/auth/login` → backend responde y setea cookie httpOnly con JWT.
3. Frontend llama `GET /api/auth/me` al montar la app para saber si hay sesión activa.

**Flujo 2 — Cargar pensum**
1. Usuario selecciona el archivo JSON (formato `docs/formato-pensum.json`).
2. Frontend valida la forma localmente (feedback inmediato si el JSON está mal).
3. `POST /api/pensums` con `{ nombre, materias }` → backend revalida con zod y guarda.
4. Frontend guarda una copia en `localStorage` vía `WebLocalStoragePensumRepository`
   (para poder seguir filtrando/trabajando sin conexión).

**Flujo 3 — Crear horario y arrastrar materias**
1. Usuario elige un pensum, define `maxCreditos` y `unidadHoraMinutos` →
   `POST /api/horarios` → backend crea el horario en `estado: 'en_progreso'`.
2. Por cada drag-and-drop de una materia a la grilla:
   a. El frontend valida localmente con `ICreditLimitStrategy` e
      `IConflictDetectionStrategy` (feedback instantáneo, sin esperar red).
   b. Si pasa, actualiza el store (Zustand) de forma optimista y en paralelo
      llama `PATCH /api/horarios/:id/bloques`.
   c. El backend vuelve a correr las mismas validaciones. Si las rechaza
      (por ejemplo, el frontend tenía datos desactualizados), responde error
      y el frontend revierte el cambio optimista.
   d. Todo cambio se persiste también en `localStorage` de inmediato, sin
      esperar la respuesta del backend.

**Flujo 4 — Finalizar semestre**
1. Usuario marca cada materia del horario como aprobada o perdida.
2. `PATCH /api/horarios/:id/finalizar` con `{ resultados: [{ materiaCodigo, aprobada }] }`.
3. Backend actualiza `estado` de cada materia en el `pensum` asociado
   (`'cursado'` si aprobó, `'activo'` si perdió) y marca el horario como
   `estado: 'finalizado'`, `finalizadoAt: now`.
4. Frontend refresca el pool de materias disponibles (ya sin las que se
   acaban de aprobar) y el horario queda visible como histórico.

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
