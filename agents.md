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

- [x] Crear estructura de carpetas del monorepo: `backend/`, `frontend/`, `package.json` raíz con `workspaces`
- [x] Crear `backend/.env.example` y `frontend/.env.example`
- [x] Crear `backend/src/config/env.ts` (validación de `MONGO_URI`, `JWT_SECRET`, `PORT`, `CORS_ORIGIN`)
- [x] Crear `backend/src/config/db.ts` (conexión Mongoose con pool)
- [x] Configurar `backend/package.json` (scripts `dev`, `build`, `start`, `test`, `test:watch`) y `tsconfig.json`
- [x] Inicializar `frontend/` con Vite (template `react-ts`)
- [x] Crear `.gitignore` raíz (`node_modules`, `.env`, `dist`)

## Fase 1 — Backend: dominio y autenticación (agente: backend)

- [x] Crear `domain/entities/` (Usuario, Materia, Pensum, Horario, Bloque — tipos puros)
- [x] Crear `domain/interfaces/` (IUserRepository, IPensumRepository, IHorarioRepository)
- [x] Crear `modules/auth/auth.repository.mongo.ts` (schema Mongoose de `users` + implementación de IUserRepository)
- [x] Crear `modules/auth/auth.service.ts` (register, login con bcrypt + JWT)
- [x] Crear `modules/auth/auth.controller.ts`
- [x] Crear `modules/auth/auth.routes.ts`
- [x] Crear `shared/middlewares/authGuard.ts`
- [x] Crear `shared/errors/AppError.ts` (+ subclases NotFoundError, ValidationError)
- [x] Crear `shared/middlewares/errorHandler.ts`
- [x] Crear `app.ts` (CORS, cookie-parser, montar rutas de auth, error handler)
- [x] Crear `server.ts` (bootstrap: `connectDB()` + `app.listen()`)

## Fase 2 — Backend: pensum (agente: backend)

- [x] Crear `modules/pensum/pensum.repository.interface.ts`
- [x] Crear `modules/pensum/pensum.repository.mongo.ts` (schema Mongoose con `materias` embebidas)
- [x] Crear `modules/pensum/pensum.validation.ts` (validación contra `docs/formato-pensum.json`)
- [x] Crear `modules/pensum/pensum.service.ts` (crear, listar, obtener, actualizar estado de materia)
- [x] Crear `modules/pensum/pensum.controller.ts`
- [x] Crear `modules/pensum/pensum.routes.ts`
- [x] Montar rutas de pensum en `app.ts`

## Fase 3 — Backend: horario y strategies (agente: backend)

- [x] Crear `modules/horario/strategies/ICreditLimitStrategy.ts` + `impl/SimpleCreditLimitStrategy.ts`
- [x] Crear `modules/horario/strategies/IConflictDetectionStrategy.ts` + `impl/SimpleConflictDetectionStrategy.ts`
- [x] Crear `modules/horario/horario.repository.interface.ts`
- [x] Crear `modules/horario/horario.repository.mongo.ts`
- [x] Crear `modules/horario/horario.service.ts` (crear horario, agregar/quitar bloque validando ambas strategies, finalizar horario actualizando el pensum)
- [x] Crear `modules/horario/horario.controller.ts`
- [x] Crear `modules/horario/horario.routes.ts`
- [x] Montar rutas de horario en `app.ts`

## Fase 4 — Frontend: base y autenticación (agente: frontend)

- [x] Configurar `shared/api/api.ts` (apiGet/apiPost/apiPatch/apiDelete, `credentials: 'include'`)
- [x] Crear `features/auth/services/AuthService.ts`
- [x] Crear `features/auth/components/LoginForm.tsx`, `RegisterForm.tsx`
- [x] Crear `features/auth/hooks/useAuth.ts`
- [x] Configurar routing base (React Router) con rutas protegidas

## Fase 5 — Frontend: pensum (agente: frontend)

- [x] Crear `features/pensum/repositories/IPensumStorageRepository.ts`
- [x] Crear `features/pensum/repositories/WebLocalStoragePensumRepository.ts`
- [x] Crear `features/pensum/repositories/MobileStoragePensumRepository.ts` (stub)
- [x] Crear `features/pensum/services/PensumService.ts` (cargar JSON, sincronizar con backend)
- [x] Crear `features/pensum/components/FiltroPensum.tsx`
- [x] Crear `features/pensum/components/PoolMaterias.tsx`
- [x] Crear `features/pensum/components/MateriaBlock.tsx` (draggable)
- [x] Pantalla de carga de pensum (input de archivo JSON + validación de forma)

## Fase 6 — Frontend: horario y drag-and-drop (agente: frontend)

- [x] Instalar y configurar `@dnd-kit/core`
- [x] Crear `features/horario/store/horarioStore.ts` (Zustand)
- [x] Crear `features/horario/strategies/` (mismas reglas que backend, TS puro)
- [x] Crear `features/horario/repositories/IHorarioStorageRepository.ts` + `WebLocalStorageHorarioRepository.ts`
- [x] Crear `features/horario/services/HorarioService.ts` (sync con backend, debounce)
- [x] Crear `features/horario/components/Grid.tsx`, `HourRow.tsx`, `DayColumn.tsx`
- [x] Crear `features/horario/components/MateriaSlot.tsx` (draggable + estados visuales: normal/gris/choque)
- [x] Crear `features/horario/components/ContadorCreditos.tsx`
- [x] Pantalla de configuración de horario (unidad de hora, créditos máx., elegir pensum)
- [x] Flujo de "finalizar semestre" (marcar aprobada/perdida por materia)

## Fase 6.5 — Corrección: consistencia de estado + estilos (agentes: backend, frontend)
 
- [x] Fix en `horario.service.ts::saveBloques`: calcular diff de códigos de
      materia (agregados/quitados) contra el horario ya persistido, ANTES de
      llamar `replaceBloques`, y actualizar el pensum en consecuencia
      (agregados → `matriculado`, quitados → `activo`)
- [x] Simplificar `HorarioPage.tsx`: quitar `initialBloquesRef` y el loop de
      `PensumService.updateMateriaEstado` en `handleGuardar` — el backend ya
      se encarga de esto en un solo `saveBloques()`
- [x] Test unitario de `horario.service`: guardar bloques sin una materia que
      antes estaba matriculada debe dejarla en `activo`
- [x] Instalar Tailwind CSS en `frontend/` y conectarlo a Vite
- [x] Agregar a `docs/theming.md`/`globals.css` los tokens que faltan:
      `--spacing-5`, `--spacing-6`, `--font-size-xs`, `--font-size-md`,
      `--radius-lg`, `--color-primary-muted`, `--color-success-bg`, `--color-danger-bg`
- [x] Refactorizar a clases de Tailwind (quitar `style={{}}` y hex sueltos) en:
      `App.tsx`, `NavBar.tsx`, `LoginForm.tsx`, `RegisterForm.tsx`,
      `CargarPensum.tsx`, `FiltroPensum.tsx`, `PoolMaterias.tsx`, `Grid.tsx`,
      `MateriaSlot.tsx`, `DropZone.tsx`, `ContadorCreditos.tsx`,
      `ConfigurarHorario.tsx`, `FinalizarHorario.tsx`, `HorarioScreen.tsx`,
      `HorarioPage.tsx`
- [x] Reemplazar los emojis 😊/😢 de aprobada/perdida por íconos de `lucide-react`

## Fase 7 — Testing (agente: testing)
 
- [x] Crear Fakes: `FakeUserRepository`, `FakePensumRepository`, `FakeHorarioRepository`
- [x] Tests unitarios: `auth.service` (8), `pensum.service` (9), `horario.service` (19)
- [x] Tests unitarios: `SimpleCreditLimitStrategy`, `SimpleConflictDetectionStrategy` (casos límite)
- [x] Test de integración: `horario.repository.mongo` con `mongodb-memory-server`
- [x] Test de integración: `auth.routes` con `supertest`
- [ ] Tests de componentes: `MateriaSlot`, `Grid` (testing-library) — **pendiente**:
      no existen; el proyecto no tiene `@testing-library/react` ni `jsdom` y no se
      instalaron (se retiró la marca en la sesión 16 para no documentar tests falsos)
- [x] Test de `horarioStore` (acciones puras)
- [x] Tests unitarios al cerrar la fase: backend 47 · frontend 17

## Fase 8 — Integración final
 
- [ ] Probar flujo completo: registro → login → cargar pensum → crear horario → arrastrar materias → finalizar semestre (requiere test manual en navegador)
- [ ] Verificar CORS y cookies en flujo real navegador↔backend (requiere test manual)
- [x] Escribir `README.md` con instrucciones de levantamiento local
- [x] `Horario.resultados` persistido en Mongo + frontend (3 vías: aprobada/perdida/deshacer)
- [x] Reversa en cascada de prerrequisitos (1 nivel) al salir de cursado
- [x] Validación: no quitar/eliminar materia cursada sin deshacer antes
- [x] Validación: finalizar requiere todas las materias marcadas
- [x] Grid dinámico: 7 días en edición, solo días con materias en vista
- [x] Domingo colapsable/expandible (localStorage)
- [x] Scroll horizontal real con minmax(110px, 1fr)
- [x] Producción monoproceso: Express sirve API + frontend estático
- [x] Script `npm start` + frontend/.env.production
- [x] Cookie JWT con `secure: true` en producción
- [x] CORS desactivado en producción (same-origin)
- [x] Backend tests: 80 · Frontend tests: 65 · Total: 145

## Fase 9 — Sesión 15: carga guiada de pensum (agente: frontend + backend)

- [x] `PROMPT_GENERAR_PENSUM` como fuente única del texto
      (`features/pensum/constants/promptGenerarPensum.ts`), con test que lo compara
      contra el cuerpo entre las líneas `---` de `docs/prompt-generar-pensum.md`
- [x] Modal "Cómo generar tu JSON" (`ModalPromptPensum.tsx`): 3 pasos, prompt en
      `<pre>` con scroll táctil, "Copiar prompt" (`navigator.clipboard` + fallback
      `textarea`/`execCommand`), estado "¡Copiado!" y sección "Cuando la IA responda"
- [x] Pestaña "Pegar JSON" en `CargarPensum.tsx`: mismo `JSON.parse` y la misma
      validación que subir archivo; "Cancelar" intacto
- [x] `validarPensumJson` (frontend, función pura) y `createPensumSchema` (backend,
      zod) acumulan todos los errores: claves faltantes, `codigo` vacío o duplicado,
      `creditos`/`semestre` numéricos, `estado` en el enum, `requiere` inexistente,
      auto-referencia y ciclos (DFS)
- [x] Resumen previo a la carga (materias, créditos, semestres) y advertencia no
      bloqueante si ninguna materia tiene prerrequisitos
- [x] `POST /api/pensums/:id/materias` valida que `requiere` exista en ese pensum
- [x] `ApiError.errores` en `shared/api/api.ts` y `Modal` con `max-h 90vh` + scroll
      interno del cuerpo para que quepa a 375px de ancho
- [x] `docs/formato-pensum.json` corregido (faltaban `FP0416` e `IA1015`) y protegido
      con tests de guardia en frontend y backend

## Fase 10 — Sesión 16: deuda técnica del resize (agente: frontend)

- [x] Resize por índice de fila real: `expandBloqueUp/Down` y `shrinkBloqueTop/Bottom`
      usan `generarFilasHora(horario.unidadHoraMinutos)` + `indicesDelBloque`
      (`gridMath.ts`) en vez de sumar/restar minutos contra `7*60`/`22*60`. Con unidad
      70, expandir arriba desde 13:00 da 12:00 (antes 11:50)
- [x] Rechazo con mensaje claro cuando `horaInicio`/`horaFin` no coinciden con una fila
      (datos viejos o cambio de unidad), en vez de aplicar un valor inválido
- [x] `expandBloqueUp`/`expandBloqueDown` validan choque con
      `IConflictDetectionStrategy` contra los demás bloques del mismo día y rechazan
      con "Hay un choque de horario con otro bloque". Achicar no valida choques
      (no puede crearlos)
- [x] Máximo 5 filas y mínimo 1 fila se calculan con la diferencia de índices
- [x] `onPointerDown`/`onTouchStart` con `stopPropagation` también en los contenedores
      de los chevrons (arriba y abajo), no solo en los botones
- [x] Tests del store: unidad 70 (expandir arriba/abajo, achicar arriba/abajo), borde
      del mediodía (12:00 ↔ 13:00), choque al expandir en ambos sentidos, vecino en
      otro día (permitido), horas fuera de grilla y máximo de 5 filas
- [ ] Tests de componentes (`MateriaSlot`, `Grid`): siguen pendientes, ver Fase 7
