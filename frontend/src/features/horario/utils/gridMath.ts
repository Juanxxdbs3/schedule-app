import type { DiaSemana } from "../types.ts";

export const DIAS_LABEL: Record<DiaSemana, string> = {
  lunes: "Lun", martes: "Mar", miercoles: "Mié",
  jueves: "Jue", viernes: "Vie",
  sabado: "Sáb", domingo: "Dom",
};

export function aMinutos(h: string): number {
  const [hh, mm] = h.split(":").map(Number);
  return hh * 60 + mm;
}

export function rowIndexFor(hora: string, filas: string[]): number {
  const m = aMinutos(hora);
  let idx = -1;
  for (let i = 0; i < filas.length; i++) {
    if (aMinutos(filas[i]) <= m) idx = i;
    else break;
  }
  return idx;
}

export interface IndicesBloque {
  /** Índice de la fila donde empieza el bloque. */
  inicio: number;
  /** Índice de la fila donde termina el bloque (exclusiva: el bloque dura fin - inicio filas). */
  fin: number;
}

/**
 * Traduce las horas de un bloque a índices de fila de la grilla.
 * Devuelve null si alguna hora no coincide exactamente con una fila (datos viejos
 * o unidad de hora distinta) o si el fin no es posterior al inicio.
 */
export function indicesDelBloque(
  horaInicio: string,
  horaFin: string,
  filas: string[],
): IndicesBloque | null {
  const inicio = filas.indexOf(horaInicio);
  const fin = filas.indexOf(horaFin);
  if (inicio === -1 || fin === -1 || fin <= inicio) return null;
  return { inicio, fin };
}

export function spanFor(horaInicio: string, horaFin: string, filas: string[]): number {
  const startM = aMinutos(horaInicio);
  const endM = aMinutos(horaFin);
  let count = 0;
  for (const f of filas) {
    const t = aMinutos(f);
    if (t >= startM && t < endM) count++;
    else if (t >= endM) break;
  }
  return Math.max(1, count);
}