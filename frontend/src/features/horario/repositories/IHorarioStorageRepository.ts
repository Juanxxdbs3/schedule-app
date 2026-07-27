import type { Horario } from "../types.ts";

export interface IHorarioStorageRepository {
  get(): Horario | null;
  save(horario: Horario): void;
  remove(): void;
}
