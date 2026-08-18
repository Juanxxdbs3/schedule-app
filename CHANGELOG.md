# Changelog

Todos los cambios notables de este proyecto se documentan en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es/1.1.0/),
y este proyecto se adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
- Scroll táctil roto en las listas de materias (dashboard y pool del horario) porque
  dnd-kit interceptaba el gesto desde el primer toque. Ahora `MateriaBlock` es
  arrastrable solo dentro del horario en edición (prop `draggable`), el mouse usa
  PointerSensor inmediato y el touch usa TouchSensor con long-press de 250ms, así un
  swipe rápido scrollea normal y mantener presionado arrastra. Hint móvil en el pool:
  "Mantén presionado y arrastra para mover".

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