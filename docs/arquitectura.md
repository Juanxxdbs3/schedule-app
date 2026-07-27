# Arquitectura — horario-app

## Contexto

App para organizar el horario semestral a partir de un pensum cargado en JSON.
El usuario filtra materias, las arrastra a una grilla (horas × días), y la app
valida en tiempo real créditos máximos y choques de horario. Al finalizar el
semestre, cada materia se marca como aprobada o perdida, actualizando el
estado consolidado en el pensum.

Patrones obligatorios: **Controller-Service-Repository (CSR)** con interfaces
+ inyección de dependencias manual, y **Strategy** para las reglas de negocio
que van a evolucionar (límite de créditos, detección de choques). Objetivo:
que agregar reglas más avanzadas de la UdeC en el futuro (prerrequisitos de
2 semestres, límite de créditos por promedio, límite de 2 semestres para
volver a matricular una materia perdida) no requiera tocar controllers ni
componentes de UI — solo añadir nuevas implementaciones de las interfaces.

## Backend (Node.js + Express + Mongoose + TypeScript)

```
backend/src/
├── config/
│   ├── env.ts
│   └── db.ts
├── domain/
│   ├── entities/        # Usuario, Materia, Pensum, Horario, Bloque (tipos puros)
│   └── interfaces/      # IUserRepository, IPensumRepository, IHorarioRepository
├── modules/
│   ├── auth/            # controller, service, repository.mongo, routes
│   ├── pensum/          # controller, service, repository.(interface|mongo), routes, validation
│   └── horario/
│       ├── strategies/
│       │   ├── ICreditLimitStrategy.ts
│       │   ├── IConflictDetectionStrategy.ts
│       │   └── impl/SimpleCreditLimitStrategy.ts, SimpleConflictDetectionStrategy.ts
│       ├── horario.controller.ts
│       ├── horario.service.ts
│       ├── horario.repository.(interface|mongo).ts
│       └── horario.routes.ts
├── shared/
│   ├── middlewares/ (authGuard, errorHandler)
│   ├── errors/
│   └── utils/
├── app.ts    # DI wiring
└── server.ts # bootstrap
```

**Regla de oro del CSR**: Controller solo traduce HTTP↔dominio, Service tiene
la lógica y recibe repos/strategies por constructor, Repository es la única
capa que toca Mongoose. Todo el cableado (instanciar e inyectar) vive en
`app.ts`, en ningún otro lado.

## Frontend (React + Vite + TypeScript + dnd-kit + Zustand)

```
frontend/src/
├── features/
│   ├── auth/
│   ├── pensum/
│   │   ├── components/ (MateriaBlock, FiltroPensum, PoolMaterias)
│   │   ├── services/PensumService.ts
│   │   └── repositories/ IPensumStorageRepository, WebLocalStoragePensumRepository, MobileStoragePensumRepository (stub)
│   └── horario/
│       ├── components/ (Grid, HourRow, DayColumn, MateriaSlot, ContadorCreditos)
│       ├── store/horarioStore.ts (Zustand)
│       ├── strategies/ (mismas reglas que backend, para feedback inmediato)
│       └── repositories/ IHorarioStorageRepository, WebLocalStorageHorarioRepository
├── shared/
│   ├── api/api.ts   # apiGet, apiPost, apiPatch, apiDelete
│   └── ui/
└── main.tsx
```

**Regla de oro del Strategy en frontend**: el drag-and-drop nunca valida
"a mano" dentro del componente — siempre llama a la strategy inyectada en el
store. El backend siempre revalida al guardar (nunca confíes solo en el cliente).

## Contrato de API (MVP)

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/auth/register` | Crea usuario |
| POST | `/api/auth/login` | Login, setea cookie httpOnly con JWT |
| POST | `/api/auth/logout` | Limpia cookie |
| GET | `/api/auth/me` | Usuario autenticado actual |
| POST | `/api/pensums` | Crea pensum (recibe el JSON de materias) |
| GET | `/api/pensums` | Lista pensums del usuario |
| GET | `/api/pensums/:id` | Detalle de un pensum |
| PATCH | `/api/pensums/:id/materias/:codigo/estado` | Actualiza el estado de UNA materia del pensum (body: `{ estado: "activo"|"matriculado"|"cursado"|"en_espera" }`) |
| DELETE | `/api/pensums/:id` | Elimina un pensum |
| POST | `/api/horarios` | Crea horario (pensumId, semestreLabel, maxCreditos, unidadHoraMinutos) |
| GET | `/api/horarios?pensumId=&estado=` | Lista horarios (histórico = `estado=finalizado`) |
| GET | `/api/horarios/:id` | Detalle de un horario |
| PATCH | `/api/horarios/:id/bloques` | Agrega/quita un bloque (valida créditos y choques) |
| PUT | `/api/horarios/:id/bloques` | horarioController.saveBloquesHandler (reemplaza todos los bloques, valida créditos+choques, actualiza materias a "matriculado") |
| PATCH | `/api/horarios/:id/resultados` | Marca UNA materia como aprobada/perdida (incremental, no cierra el horario) |
| PATCH | `/api/horarios/:id/finalizar` | Cierra el horario (sin body), cambia estado a `finalizado` |
| DELETE | `/api/horarios/:id` | Elimina un horario |

Todas las rutas (excepto `register`/`login`) pasan por `authGuard`.

## Autenticación

JWT firmado, en cookie `httpOnly`, `sameSite: 'lax'`. CORS configurado con
`credentials: true` y `origin` restringido a `VITE_API_BASE_URL`/frontend.

## Sincronización offline

Todo cambio en la grilla se guarda primero en `localStorage` (a través de
`IHorarioStorageRepository`), y en paralelo se intenta sincronizar contra el
backend con debounce. Si falla por falta de conexión, se reintenta más tarde
— la UI nunca espera al backend para responder al usuario.
