import type { IPensumStorageRepository } from "./IPensumStorageRepository.ts";
import type { Pensum } from "../types.ts";

export class MobileStoragePensumRepository implements IPensumStorageRepository {
  save(_pensum: Pensum): void {
    throw new Error("NotImplemented");
  }

  get(): Pensum | null {
    throw new Error("NotImplemented");
  }

  remove(): void {
    throw new Error("NotImplemented");
  }
}
