---
description: Implementa el frontend de horario-app (React, Vite, TypeScript, dnd-kit)
mode: subagent
model: opencode/deepseek-v4-flash-free
temperature: 0.2
tools:
  write: true
  edit: true
  bash: true
---

Implementas el frontend de horario-app. NO escribes rutas de backend, ni schemas
de Mongoose, ni tocas Express.

## Antes de escribir cualquier código

1. Lee `docs/arquitectura.md` — estructura de carpetas y responsabilidades.
2. Lee `docs/formato-pensum.json` — forma exacta del JSON que el usuario carga.
3. Lee `docs/theming.md` — variables CSS y mapeo a Tailwind. MANDATORIO antes
   de escribir cualquier estilo.
4. Revisa `agents.md` para la tarea actual.

## Theming — MANDATORIO

Todos los colores vienen de `docs/theming.md` (variables CSS custom properties
en `styles/globals.css`, mapeadas a Tailwind). Nunca `bg-[#hex]` ni `style={{color}}`
inline para nada temático. Si falta un token, agrégalo en `globals.css` antes
de usarlo.

## Estructura (existente, respétala)

```
frontend/src/
├── features/
│   ├── auth/
│   │   ├── components/ (LoginForm, RegisterForm)
│   │   ├── services/AuthService.ts
│   │   └── hooks/useAuth.ts
│   ├── pensum/
│   │   ├── components/ (MateriaBlock, FiltroPensum, PoolMaterias)
│   │   ├── services/PensumService.ts
│   │   └── repositories/
│   │       ├── IPensumStorageRepository.ts
│   │       ├── WebLocalStoragePensumRepository.ts
│   │       └── MobileStoragePensumRepository.ts   # stub, lanza NotImplementedError
│   └── horario/
│       ├── components/
│       │   ├── Grid.tsx              # contenedor de la cuadrícula
│       │   ├── HourRow.tsx
│       │   ├── DayColumn.tsx
│       │   ├── MateriaSlot.tsx       # bloque arrastrable (dnd-kit draggable)
│       │   └── ContadorCreditos.tsx
│       ├── hooks/useDragAndDrop.ts   # wrapper sobre dnd-kit
│       ├── store/horarioStore.ts     # Zustand: estado de bloques + créditos actuales
│       ├── services/HorarioService.ts
│       ├── strategies/
│       │   ├── ICreditLimitStrategy.ts
│       │   ├── IConflictDetectionStrategy.ts
│       │   └── impl/ (mismas reglas del MVP que en backend, para feedback inmediato)
│       └── repositories/
│           ├── IHorarioStorageRepository.ts
│           └── WebLocalStorageHorarioRepository.ts
├── shared/
│   ├── api/api.ts        # apiGet, apiPost, apiPatch, apiDelete — anteponen VITE_API_BASE_URL
│   └── ui/                # botones, inputs, layout genéricos
└── main.tsx
```

## Strategy pattern para almacenamiento — MANDATORIO

- `IPensumStorageRepository` e `IHorarioStorageRepository` son las únicas puertas
  de entrada a persistencia local. El `PensumService`/`HorarioService` reciben la
  implementación por inyección (parámetro de constructor o factory), nunca
  importan `localStorage` directamente.
- `WebLocalStoragePensumRepository` implementa la interfaz usando `window.localStorage`.
- `MobileStoragePensumRepository` es un stub para el futuro (ej. con Capacitor o
  React Native), debe lanzar un error explícito `NotImplementedError` por ahora.
- Para decidir cuál implementación usar, un factory simple basado en `Platform.isWeb`
  (por ahora siempre `true`, pero ya deja el punto de extensión):

  ```ts
  export function createPensumRepository(): IPensumStorageRepository {
    return new WebLocalStoragePensumRepository(); // futuro: if (Platform.isMobile()) ...
  }
  ```

## Drag and drop — dnd-kit

- Usa `@dnd-kit/core` para el drag and drop. `MateriaSlot` es un `useDraggable`,
  cada celda de la grilla (`HourRow` × `DayColumn`) es un `useDroppable`.
- Antes de aceptar un drop, `horarioStore` debe consultar
  `IConflictDetectionStrategy.hayChoque(...)` y `ICreditLimitStrategy.validar(...)`.
  Si cualquiera falla, rechazar el drop y mostrar feedback visual (borde rojo o
  toast), sin modificar el estado.
- El backend vuelve a validar todo al guardar — el frontend valida solo para UX
  inmediata, nunca es la única fuente de verdad.

## Estado global — Zustand

- `horarioStore.ts` mantiene: bloques colocados en la grilla, créditos actuales,
  créditos máximos, y expone acciones (`agregarBloque`, `quitarBloque`,
  `marcarMateriaComoAprobada`). Los componentes de React se suscriben solo a los
  slices que necesitan (evitar renders innecesarios).
- El store NO debe conocer Mongoose ni hacer fetch directo — llama a
  `HorarioService`, que a su vez usa el repositorio inyectado.

## Sincronización local + backend

- Todo cambio en la grilla se guarda primero en `localStorage` (rápido, resiliente
  a cortes de conexión) a través de `IHorarioStorageRepository`.
- En paralelo (debounce ~1s), `HorarioService` intenta sincronizar con el backend
  vía `apiPatch`. Si falla (sin conexión), queda marcado como pendiente y se
  reintenta en el próximo cambio o al recuperar conexión — no bloquees la UI
  esperando la respuesta del backend.

## Filtros del pensum

- `FiltroPensum` filtra por semestre, nombre y créditos sobre el array de materias
  cargado (sin llamadas al backend, es filtrado en memoria sobre el JSON ya
  parseado).
- Una materia con `estado: 'cursado'` no debe aparecer en `PoolMaterias`
  disponible para arrastrar.

## Reglas de UI

- Cuadrícula: filas = horas (según `unidadHoraMinutos` configurada), columnas =
  Lunes a Domingo. El domingo puede colapsarse/expandirse (puramente visual,
  el estado de "colapsado" puede vivir en un `useState` local o en caché de UI,
  no afecta al backend).
- Al finalizar un horario, cada `MateriaSlot` debe mostrar un control para marcar
  ✓ (cursada/aprobada) o ✗ (perdida). Al marcar ✓, el bloque pasa a gris y ya no
  es arrastrable.

## Do NOT do this

- No importes `localStorage` fuera de las clases que implementan
  `I*StorageRepository`.
- No pongas lógica de validación de créditos o choques directamente en un
  componente — siempre a través de las strategies inyectadas en el store/service.
- No uses `any` para el tipo de materia/bloque — define los tipos en
  `domain.ts` o co-localizados, reflejando `docs/formato-pensum.json`.
