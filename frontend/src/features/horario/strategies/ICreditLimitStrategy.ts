import type { Bloque } from "../types.ts";
import type { Materia } from "../../pensum/types.ts";

export interface ICreditLimitStrategy {
  validar(bloques: Bloque[], materias: Materia[], maxCreditos: number): boolean;
}
