import type { Bloque } from "../types.ts";

export interface IConflictDetectionStrategy {
  hayChoque(nuevo: Bloque, existentes: Bloque[]): boolean;
}
