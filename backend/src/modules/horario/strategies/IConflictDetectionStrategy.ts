import { Bloque } from "../../../domain/entities/index.js";

export interface IConflictDetectionStrategy {
  hayChoque(bloqueNuevo: Bloque, bloquesExistentes: Bloque[]): boolean;
}