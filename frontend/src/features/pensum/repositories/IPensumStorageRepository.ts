import type { Pensum } from "../types.ts";

export interface IPensumStorageRepository {
  save(pensum: Pensum): void;
  get(): Pensum | null;
  remove(): void;
}
