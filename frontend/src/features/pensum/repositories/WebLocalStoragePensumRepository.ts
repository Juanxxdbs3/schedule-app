import type { IPensumStorageRepository } from "./IPensumStorageRepository.ts";
import type { Pensum } from "../types.ts";

const STORAGE_KEY = "pensum";

export class WebLocalStoragePensumRepository implements IPensumStorageRepository {
  save(pensum: Pensum): void {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(pensum));
    } catch {
      throw new Error("No se pudo guardar el pensum en almacenamiento local");
    }
  }

  get(): Pensum | null {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as Pensum;
    } catch {
      return null;
    }
  }

  remove(): void {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      throw new Error("No se pudo eliminar el pensum del almacenamiento local");
    }
  }
}
