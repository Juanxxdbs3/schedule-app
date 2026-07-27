import type { Bloque } from "../types.ts";
import type { IConflictDetectionStrategy } from "./IConflictDetectionStrategy.ts";

function aMinutos(hora: string): number {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}

export class SimpleConflictDetectionStrategy implements IConflictDetectionStrategy {
  hayChoque(nuevo: Bloque, existentes: Bloque[]): boolean {
    const iniNuevo = aMinutos(nuevo.horaInicio);
    const finNuevo = aMinutos(nuevo.horaFin);

    return existentes.some((b) => {
      if (b.dia !== nuevo.dia) return false;
      if (b.materiaCodigo === nuevo.materiaCodigo) return false;
      const iniExist = aMinutos(b.horaInicio);
      const finExist = aMinutos(b.horaFin);
      return iniNuevo < finExist && finNuevo > iniExist;
    });
  }
}
