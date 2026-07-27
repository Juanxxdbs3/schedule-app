import { Bloque, Materia } from "../../../../domain/entities/index.js";
import { ICreditLimitStrategy } from "../ICreditLimitStrategy.js";
import { ValidationError } from "../../../../shared/errors/AppError.js";

export class SimpleCreditLimitStrategy implements ICreditLimitStrategy {
  validar(bloques: Bloque[], materias: Materia[], maxCreditos: number): boolean {
    if (!Array.isArray(bloques)) throw new ValidationError("bloques debe ser un array");

    const creditosMap = new Map<string, number>();
    for (const m of materias) {
      creditosMap.set(m.codigo, m.creditos);
    }

    const codigosUnicos = new Set(bloques.map((b) => b.materiaCodigo));
    let suma = 0;
    for (const codigo of codigosUnicos) {
      const creditos = creditosMap.get(codigo);
      if (creditos !== undefined) {
        suma += creditos;
      }
    }

    return suma <= maxCreditos;
  }
}