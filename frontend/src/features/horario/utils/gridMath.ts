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