import { Bloque, Materia } from "../../../domain/entities/index.js";

export interface ICreditLimitStrategy {
  validar(bloques: Bloque[], materias: Materia[], maxCreditos: number): boolean;
}