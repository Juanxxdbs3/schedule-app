import { Bloque } from "../../../../domain/entities/index.js";
import { IConflictDetectionStrategy } from "../IConflictDetectionStrategy.js";

export class SimpleConflictDetectionStrategy implements IConflictDetectionStrategy {
  hayChoque(bloqueNuevo: Bloque, bloquesExistentes: Bloque[]): boolean {
    for (const existente of bloquesExistentes) {
      if (existente.dia !== bloqueNuevo.dia) continue;

      // Superposición: A (inicioA-finA) y B (inicioB-finB) se superponen si inicioA < finB && finA > inicioB
      if (bloqueNuevo.horaInicio < existente.horaFin && bloqueNuevo.horaFin > existente.horaInicio) {
        return true;
      }
    }
    return false;
  }
}
