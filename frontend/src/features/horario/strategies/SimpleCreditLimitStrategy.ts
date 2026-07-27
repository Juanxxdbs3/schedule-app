import type { Bloque } from "../types.ts";
import type { Materia } from "../../pensum/types.ts";
import type { ICreditLimitStrategy } from "./ICreditLimitStrategy.ts";

export class SimpleCreditLimitStrategy implements ICreditLimitStrategy {
  validar(bloques: Bloque[], materias: Materia[], maxCreditos: number): boolean {
    const materiaMap = new Map(materias.map((m) => [m.codigo, m]));
    const codigosUnicos = new Set(bloques.map((b) => b.materiaCodigo));
    let suma = 0;
    for (const codigo of codigosUnicos) {
      const materia = materiaMap.get(codigo);
      if (materia) suma += materia.creditos;
    }
    return suma <= maxCreditos;
  }
}
