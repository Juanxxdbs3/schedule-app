import { Bloque, Materia } from "../../../../domain/entities/index.js";
import { ICreditLimitStrategy } from "../ICreditLimitStrategy.js";

export class SimpleCreditLimitStrategy implements ICreditLimitStrategy {
  validar(bloques: Bloque[], materias: Materia[], maxCreditos: number): boolean {
    const creditosMap = new Map<string, number>();
    for (const m of materias) {
      creditosMap.set(m.codigo, m.creditos);
    }

    let suma = 0;
    for (const b of bloques) {
      const creditos = creditosMap.get(b.materiaCodigo);
      if (creditos !== undefined) {
        suma += creditos;
      }
    }

    return suma <= maxCreditos;
  }
}