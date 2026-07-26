import { apiGet, apiPost, apiDelete } from "../../../shared/api/api.ts";
import type { Pensum, Materia } from "../types.ts";
import type { IPensumStorageRepository } from "../repositories/IPensumStorageRepository.ts";
import { WebLocalStoragePensumRepository } from "../repositories/WebLocalStoragePensumRepository.ts";

function createStorageRepo(): IPensumStorageRepository {
  return new WebLocalStoragePensumRepository();
}

type ValidationResultOk = { ok: true; data: { nombre: string; materias: Materia[] } };
type ValidationResultFail = { ok: false; error: string };
type ValidationResult = ValidationResultOk | ValidationResultFail;

interface PensumCreateResponse {
  pensum: Pensum;
}

interface PensumListResponse {
  pensums: Pensum[];
}

interface PensumGetResponse {
  pensum: Pensum;
}

const VALID_ESTADOS = ["activo", "matriculado", "cursado", "en_espera"];

export const PensumService = {
  create: (nombre: string, materias: Materia[]) =>
    apiPost<PensumCreateResponse>("/pensums", { nombre, materias }),

  list: () => apiGet<PensumListResponse>("/pensums"),

  getById: (id: string) => apiGet<PensumGetResponse>(`/pensums/${id}`),

  remove: (id: string) => apiDelete<void>(`/pensums/${id}`),

  validateJSON(json: unknown): ValidationResult {
    if (!json || typeof json !== "object") {
      return { ok: false, error: "El archivo no es un objeto JSON válido" };
    }

    const obj = json as Record<string, unknown>;

    if (typeof obj.nombre !== "string" || obj.nombre.length === 0) {
      return { ok: false, error: "Falta el campo 'nombre' (string)" };
    }

    if (!Array.isArray(obj.materias) || obj.materias.length === 0) {
      return { ok: false, error: "Falta el campo 'materias' (array no vacío)" };
    }

    for (let i = 0; i < obj.materias.length; i++) {
      const m = obj.materias[i] as Record<string, unknown>;

      if (typeof m.codigo !== "string" || m.codigo.length < 3) {
        return { ok: false, error: `Materia ${i}: 'codigo' debe ser string de al menos 3 caracteres` };
      }

      if (typeof m.nombre !== "string" || m.nombre.length === 0) {
        return { ok: false, error: `Materia ${i}: falta 'nombre'` };
      }

      if (typeof m.creditos !== "number" || m.creditos < 1) {
        return { ok: false, error: `Materia ${i}: 'creditos' debe ser número positivo` };
      }

      if (typeof m.semestre !== "number" || m.semestre < 1) {
        return { ok: false, error: `Materia ${i}: 'semestre' debe ser número positivo` };
      }

      if (!Array.isArray(m.requiere)) {
        return { ok: false, error: `Materia ${i}: 'requiere' debe ser array` };
      }

      const estado = m.estado as string;
      if (!VALID_ESTADOS.includes(estado)) {
        return {
          ok: false,
          error: `Materia ${i}: 'estado' inválido (debe ser activo/matriculado/cursado/en_espera)`,
        };
      }
    }

    return {
      ok: true,
      data: { nombre: obj.nombre as string, materias: obj.materias as Materia[] },
    };
  },

  storage: createStorageRepo(),
};
