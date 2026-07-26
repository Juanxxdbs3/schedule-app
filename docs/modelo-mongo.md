# Modelo de datos — MongoDB (MVP)

Tres colecciones. `materias` y `bloques` van **embebidos** (subdocumentos), no
son colecciones aparte — es la forma natural en Mongo para datos que siempre
se leen junto con su padre y no se consultan de forma independiente.

## `users`

```ts
{
  _id: ObjectId,
  username: string,       // unique, index
  email: string,          // unique, index
  passwordHash: string,
  createdAt: Date,
}
```

## `pensums`

```ts
{
  _id: ObjectId,
  userId: ObjectId,        // index (para listar "mis pensums" rápido)
  nombre: string,
  materias: [
    {
      codigo: string,       // único dentro del array, no a nivel global
      nombre: string,
      creditos: number,
      semestre: number,
      requiere: string[],   // códigos de prerrequisitos
      estado: 'activo' | 'matriculado' | 'cursado' | 'en_espera',
    }
  ],
  createdAt: Date,
  updatedAt: Date,
}
```

Índice compuesto sugerido: `{ userId: 1 }` (lista de pensums por usuario).

## `horarios`

```ts
{
  _id: ObjectId,
  userId: ObjectId,         // index
  pensumId: ObjectId,       // index
  semestreLabel: string,    // ej. "2026-2"
  maxCreditos: number,
  unidadHoraMinutos: number, // 30, 50, 60...
  estado: 'en_progreso' | 'finalizado',
  bloques: [
    {
      materiaCodigo: string,  // referencia al codigo dentro de pensums.materias
      dia: 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo',
      horaInicio: string,     // "07:00"
      horaFin: string,        // "09:30"
    }
  ],
  createdAt: Date,
  finalizadoAt: Date | null,
}
```

Índice compuesto sugerido: `{ userId: 1, estado: 1 }` (para consultar
rápidamente el histórico de horarios finalizados).

## Reglas de consistencia (a nivel de Service, no de esquema)

- La suma de `creditos` de las materias referenciadas por `bloques` nunca debe
  exceder `maxCreditos` — lo valida `ICreditLimitStrategy` en el service, no
  el schema de Mongoose.
- Dos bloques del mismo horario no pueden compartir `dia` + rango horario
  superpuesto — lo valida `IConflictDetectionStrategy`.
- Al hacer `PATCH /horarios/:id/finalizar`, el service debe actualizar el
  `estado` de la materia correspondiente en el `pensum` asociado:
  `'cursado'` si fue aprobada, o de vuelta a `'activo'` si fue perdida.
- No se crean colecciones de "histórico" separadas: un horario con
  `estado: 'finalizado'` ES el histórico.
