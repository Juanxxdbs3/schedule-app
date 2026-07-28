import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from "../../../shared/api/api.ts";
import type { Horario, Bloque } from "../types.ts";

interface HorarioCreateResponse {
  horario: Horario;
}

interface HorarioListResponse {
  horarios: Horario[];
}

interface HorarioGetResponse {
  horario: Horario;
}

export const HorarioService = {
  create: (pensumId: string, semestreLabel: string, maxCreditos: number, unidadHoraMinutos: number) =>
    apiPost<HorarioCreateResponse>("/horarios", { pensumId, semestreLabel, maxCreditos, unidadHoraMinutos }),

  list: (params?: { pensumId?: string; estado?: string }) => {
    const search = new URLSearchParams();
    if (params?.pensumId) search.set("pensumId", params.pensumId);
    if (params?.estado) search.set("estado", params.estado);
    const qs = search.toString();
    return apiGet<HorarioListResponse>(`/horarios${qs ? `?${qs}` : ""}`);
  },

  getById: (id: string) => apiGet<HorarioGetResponse>(`/horarios/${id}`),

  saveBloques: (horarioId: string, bloques: Bloque[]) =>
    apiPut<void>(`/horarios/${horarioId}/bloques`, { bloques }),

  addBloque: (horarioId: string, bloque: Bloque) =>
    apiPatch<void>(`/horarios/${horarioId}/bloques`, bloque),

  removeBloque: (horarioId: string, bloqueId: string) =>
    apiDelete<void>(`/horarios/${horarioId}/bloques/${bloqueId}`),

  marcarResultado: (horarioId: string, materiaCodigo: string, resultado: 'aprobada' | 'perdida' | null) =>
    apiPatch<void>(`/horarios/${horarioId}/resultados`, { materiaCodigo, resultado }),

  finalizar: (horarioId: string) =>
    apiPatch<void>(`/horarios/${horarioId}/finalizar`),

  delete: (id: string) => apiDelete<void>(`/horarios/${id}`),
};
