import { apiGet, apiPost, apiPatch, apiDelete } from "../../../shared/api/api.ts";
import type { Pensum, Materia } from "../types.ts";
import type { IPensumStorageRepository } from "../repositories/IPensumStorageRepository.ts";
import { WebLocalStoragePensumRepository } from "../repositories/WebLocalStoragePensumRepository.ts";

function createStorageRepo(): IPensumStorageRepository {
  return new WebLocalStoragePensumRepository();
}

interface PensumCreateResponse {
  pensum: Pensum;
}

interface PensumListResponse {
  pensums: Pensum[];
}

interface PensumGetResponse {
  pensum: Pensum;
}

export const PensumService = {
  create: (nombre: string, materias: Materia[]) =>
    apiPost<PensumCreateResponse>("/pensums", { nombre, materias }),

  list: () => apiGet<PensumListResponse>("/pensums"),

  getById: (id: string) => apiGet<PensumGetResponse>(`/pensums/${id}`),

  agregarMateria: (pensumId: string, materia: Materia) =>
    apiPost<PensumGetResponse>(`/pensums/${pensumId}/materias`, materia),

  updateMateriaEstado: (pensumId: string, codigo: string, estado: string) =>
    apiPatch<void>(`/pensums/${pensumId}/materias/${codigo}/estado`, { estado }),

  remove: (id: string) => apiDelete<void>(`/pensums/${id}`),

  storage: createStorageRepo(),
};
