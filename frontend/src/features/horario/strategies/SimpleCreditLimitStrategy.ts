import type { Bloque } from "../types.ts";
import type { Materia } from "../../pensum/types.ts";
import type { ICreditLimitStrategy } from "./ICreditLimitStrategy.ts";

export class SimpleCreditLimitStrategy implements ICreditLimitStrategy {
  validar(bloques: Bloque[], materias: Materia[], maxCreditos: number): boolean {
    const creditosUsados = bloques.reduce((total, b) => {
      const materia = materias.find((m) => m.codigo === b.materiaCodigo);
      return total + (materia?.creditos ?? 0);
    }, 0);
    return creditosUsados <= maxCreditos;
  }
}
