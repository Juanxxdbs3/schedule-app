# Changelog

Todos los cambios notables de este proyecto se documentan en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es/1.1.0/),
y este proyecto se adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.3.0] - 2026-10-24

### Added

- Importación guiada de pensum: botón "¿Cómo genero el JSON? Ver prompt" en
  "Cargar pensum" que abre un modal con los 3 pasos, el prompt completo para la IA
  y una sección "Cuando la IA responda". El texto vive en `PROMPT_GENERAR_PENSUM`
  (`features/pensum/constants/promptGenerarPensum.ts`), con un test que lo compara
  contra `docs/prompt-generar-pensum.md` para que no se desincronicen.
- Botón "Copiar prompt" con `navigator.clipboard` y fallback por `textarea` +
  `execCommand` para contextos no seguros (http en LAN): cambia a "¡Copiado!" con
  `CheckCircle2` durante 2 s y avisa por el `uiStatusStore`.
- Pestaña "Pegar JSON" como alternativa a subir archivo: útil en el teléfono, donde
  guardar un `.json` desde un chat de IA es incómodo. Ambas rutas pasan por el mismo
  parseo y validación.
- `validarPensumJson` (`features/pensum/utils/validarPensumJson.ts`): validación pura
  que acumula TODOS los errores y devuelve un resumen (materias, créditos, semestres,
  materias con prerrequisitos). Reglas: claves obligatorias, `codigo` no vacío y único,
  `creditos` numérico > 0, `semestre` entero >= 1, `estado` en el enum, `requiere` con
  códigos existentes, sin auto-referencia y sin ciclos (DFS).
- Resumen previo a la carga ("Se detectaron 61 materias, 162 créditos, 9 semestres") y
  advertencia no bloqueante cuando ninguna materia tiene prerrequisitos.
- Tests: +19 en backend (`pensum.validation`, `pensum.service`) y +33 en frontend
  (`validarPensumJson`, `promptGenerarPensum`, `horarioStore`).

### Changed

- El backend valida el pensum completo con zod: `createPensumSchema` acumula errores de
  campo y cruzados (códigos duplicados, prerrequisitos inexistentes, auto-referencia y
  ciclos) y responde `400` con `{ error, errores: string[] }`. `materias` sigue siendo
  opcional con `default []` para crear pensums vacíos.
- `POST /api/pensums/:id/materias` verifica que los códigos de `requiere` existan en ese
  pensum y que la materia no se requiera a sí misma.
- `shared/api/api.ts` expone `ApiError.errores` y arma un mensaje legible cuando el
  backend devuelve una lista de errores.
- El `Modal` compartido limita su altura a `90vh` y hace scroll interno del cuerpo, para
  que los modales largos quepan en pantallas de 375px de ancho.
- El resize de bloques (expandir/achicar) navega por índices de fila de
  `generarFilasHora(horario.unidadHoraMinutos)` (`indicesDelBloque` en `gridMath.ts`) en
  lugar de sumar o restar minutos. Con unidades que no dividen limpio (por ejemplo 70)
  o con la pausa de mediodía, las horas resultantes ahora siempre son filas reales.

### Fixed

- Con unidad de 70 minutos, expandir hacia arriba desde las 13:00 daba 11:50 (una hora
  que no existe en la grilla); ahora da 12:00. Igual para expandir/achicar hacia abajo.
- Expandir un bloque podía solaparlo con otro del mismo día: el estado inválido llegaba
  a Zustand y se persistía al guardar. Ahora `expandBloqueUp`/`expandBloqueDown` validan
  el choque y rechazan con "Hay un choque de horario con otro bloque".
- Si las horas de un bloque no coinciden con una fila (datos viejos o cambio de unidad),
  el resize se rechaza con un mensaje claro en vez de aplicar un valor inválido.
- Tocar el padding o el espacio entre los chevrons de resize iniciaba el drag del bloque:
  los contenedores ahora detienen `pointerdown`/`touchstart` como los botones.
- `docs/formato-pensum.json` referenciaba dos códigos inexistentes (`FP0416`, `IA1015`)
  y ya no pasaba la validación de `requiere`; se agregaron como materias de semestre 4
  y hay tests de guardia en frontend y backend.

### Removed

- `PensumService.validateJSON` (validación duplicada y parcial): la reemplaza
  `validarPensumJson`, que además reporta todos los errores a la vez.

## [1.2.0] - 2026-08-17

### Fixed

- Expandir un bloque hacia arriba estando en la primera hora (07:00) producía un
  `horaInicio` inválido y el bloque desaparecía de la grilla sin error. Ahora se
  valida el límite del día: expandir arriba a las 07:00 y expandir abajo a las 22:00
  se rechazan con mensaje claro.
- Los botones de crecer/achicar (chevrons) en bloques colocados podían no responder:
  el `pointerdown`/`touchstart` burbujeaba al elemento draggable (dnd-kit iniciaba
  un drag con long-press en touch o un click con movimiento en mouse) y las pestañas
  asomaban a la fila vecina quedando tapadas. Ahora los botones detienen la
  propagación de esos eventos y las pestañas se apoyan sobre el borde del propio
  bloque (con sombra ligera) sin invadir la fila de al lado.
- Scroll táctil roto en las listas de materias (dashboard y pool del horario) porque
  dnd-kit interceptaba el gesto desde el primer toque. Ahora `MateriaBlock` es
  arrastrable solo dentro del horario en edición (prop `draggable`), el mouse usa
  PointerSensor inmediato y el touch usa TouchSensor con long-press de 250ms, así un
  swipe rápido scrollea normal y mantener presionado arrastra. Hint móvil en el pool:
  "Mantén presionado y arrastra para mover".

### Added

- Achicar bloques de horario: `shrinkBloqueTop`/`shrinkBloqueBottom` en el store
  (espejo de `expandBloqueUp/Down`, mínimo 1 unidad de hora). En la grilla, los
  controles de borde pasan de muescas de arrastre a botones con chevrons: en el borde
  superior `ChevronUp` (crecer hacia arriba) + `ChevronDown` (achicar desde arriba),
  espejados en el inferior. En bloques de 1 unidad se ocultan los botones de achicar.
- Exportar el horario desde las vistas "En curso" y "Finalizado": botones SVG y JPEG
  en el header. `generarSvgHorario` (función pura en `utils/exportHorarioSvg.ts`)
  dibuja la misma grilla de horas/días que en pantalla con un rectángulo por bloque
  (color según estado, nombre, profesor, salón, horas y badge aprobada/perdida si hay
  resultado), reutilizando la lógica de posicionamiento extraída a `utils/gridMath.ts`.
  La descarga SVG usa Blob + `<a download>`; la JPEG renderiza el SVG en un canvas
  con fondo blanco (JPEG no soporta transparencia).

## [1.1.0] - 2026-08-17

### Fixed

- Al abrir un horario en progreso se llega directo a la vista de curso (aprobar/desaprobar)
  en lugar de la vista de edición. El modo ya no se resetea al marcar resultados de materias.
- Botón "Cancelar" al cargar un nuevo pensum: cierra el área de carga y vuelve a la lista
  de pensums existentes sin recargar la página.
- Proporciones del dashboard: las tarjetas "Pensums" y "Mis horarios" ahora ocupan 50/50.
- Contraste de los acentos por estado de materia (texto de bloques en la grilla, badges
  "En curso"/"Modo edición"/"Finalizado") en modo oscuro: ahora usan tokens con variantes
  claras sobre el fondo morado oscuro.
- Pase de responsividad mobile-first: NavBar con menú hamburguesa, dashboard y filtros
  apilados en móvil, grilla de materias a 1 columna, horario con grilla+pool apilados y
  botones en fila propia, modales/formularios con ancho seguro en pantallas angostas.

### Added

- Crear un pensum vacío por nombre (solo el nombre de la carrera) con el botón
  "+ Nuevo pensum" del dashboard, para después ir agregando materias manualmente.
  El backend acepta pensums sin materias (`materias` opcional con default `[]`).
- Eliminar un pensum desde el dashboard (visible solo cuando el pensum está
  seleccionado/abierto) con modal de confirmación.
- Agregar materia manualmente a un pensum ya cargado:
  - Backend: `POST /api/pensums/:id/materias` (valida dueño del pensum, rechaza códigos
    duplicados y usa `estado: "activo"` por defecto).
  - Frontend: botón "+ Agregar materia" en el dashboard con formulario en modal.
- Toggle de modo oscuro en el navbar (ícono sol/luna), con preferencia guardada en
  `localStorage` (`horario-app:theme`) y default según `prefers-color-scheme` del sistema.
- Tipografía de títulos: Poppins para `h1`–`h3` y el logo, manteniendo Inter para el cuerpo.
- Indicador global de estado (toast) en la esquina inferior izquierda con
  `uiStatusStore` (loading/saving/success/error) conectado a guardar bloques,
  marcar resultado, finalizar, eliminar, cargar pensum, agregar materia, login y registro.

### Changed

- Radios de la UI: `--radius-md` 8px → 10px, `--radius-lg` 12px → 16px.
- Botones primarios: clase `btn-primary` con sombra con tinte del color primario,
  transición suave y hover con elevación/escala; padding vertical ligeramente mayor.