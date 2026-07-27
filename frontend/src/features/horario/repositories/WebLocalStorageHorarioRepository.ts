import type { Horario } from "../types.ts";
import type { IHorarioStorageRepository } from "./IHorarioStorageRepository.ts";

const STORAGE_KEY = "horario";

export class WebLocalStorageHorarioRepository implements IHorarioStorageRepository {
  get(): Horario | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Horario) : null;
    } catch {
      return null;
    }
  }

  save(horario: Horario): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(horario));
  }

  remove(): void {
    localStorage.removeItem(STORAGE_KEY);
  }
}
