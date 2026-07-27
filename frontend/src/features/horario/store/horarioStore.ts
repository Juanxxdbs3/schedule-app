import { create } from "zustand";
import type { Horario, Bloque } from "../types.ts";
import type { Materia } from "../../pensum/types.ts";
import { SimpleCreditLimitStrategy } from "../strategies/SimpleCreditLimitStrategy.ts";
import { SimpleConflictDetectionStrategy } from "../strategies/SimpleConflictDetectionStrategy.ts";
import { HorarioService } from "../services/HorarioService.ts";
import { WebLocalStorageHorarioRepository } from "../repositories/WebLocalStorageHorarioRepository.ts";
import type { IHorarioStorageRepository } from "../repositories/IHorarioStorageRepository.ts";

type AddBloqueResult = { ok: true } | { ok: false; error: string };

interface HorarioState {
  horario: Horario | null;
  loading: boolean;
  error: string | null;
  storage: IHorarioStorageRepository;

  setHorario: (h: Horario) => void;
  fetchHorarios: (pensumId: string) => Promise<void>;
  createHorario: (pensumId: string, semestreLabel: string, maxCreditos: number, unidadHoraMinutos: number) => Promise<Horario>;
  addBloque: (bloque: Bloque, materias: Materia[]) => Promise<AddBloqueResult>;
  removeBloque: (materiaCodigo: string) => Promise<void>;
  marcarResultado: (materiaCodigo: string, aprobada: boolean) => Promise<void>;
  finalizar: () => Promise<void>;
  clear: () => void;
}

const creditLimit = new SimpleCreditLimitStrategy();
const conflictCheck = new SimpleConflictDetectionStrategy();

export const useHorarioStore = create<HorarioState>((set, get) => ({
  horario: null,
  loading: false,
  error: null,
  storage: new WebLocalStorageHorarioRepository(),

  setHorario: (h) => {
    set({ horario: h });
    get().storage.save(h);
  },

  fetchHorarios: async (pensumId) => {
    set({ loading: true, error: null });
    try {
      const res = await HorarioService.list({ pensumId, estado: "en_progreso" });
      const h = res.horarios[0] ?? null;
      if (h) get().storage.save(h);
      set({ horario: h, loading: false });
    } catch {
      const local = get().storage.get();
      if (local && local.pensumId === pensumId) {
        set({ horario: local, loading: false });
      } else {
        set({ loading: false });
      }
    }
  },

  createHorario: async (pensumId, semestreLabel, maxCreditos, unidadHoraMinutos) => {
    set({ loading: true, error: null });
    try {
      const res = await HorarioService.create(pensumId, semestreLabel, maxCreditos, unidadHoraMinutos);
      get().storage.save(res.horario);
      set({ horario: res.horario, loading: false });
      return res.horario;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error al crear horario";
      set({ error: msg, loading: false });
      throw e;
    }
  },

  addBloque: async (bloque, materias) => {
    const { horario } = get();
    if (!horario) return { ok: false, error: "No hay horario activo" };

    const nuevosBloques = [...horario.bloques, bloque];

    if (conflictCheck.hayChoque(bloque, horario.bloques)) {
      return { ok: false, error: "La materia se superpone con un bloque existente" };
    }

    if (!creditLimit.validar(nuevosBloques, materias, horario.maxCreditos)) {
      return { ok: false, error: "Se excedería el límite de créditos" };
    }

    set((s) => ({
      horario: s.horario ? { ...s.horario, bloques: nuevosBloques } : null,
    }));

    try {
      await HorarioService.addBloque(horario.id, bloque);
      return { ok: true };
    } catch {
      set((s) => ({
        horario: s.horario ? { ...s.horario, bloques: horario.bloques } : null,
      }));
      return { ok: false, error: "Error al guardar en el servidor" };
    }
  },

  removeBloque: async (materiaCodigo) => {
    const { horario } = get();
    if (!horario) return;

    const nuevosBloques = horario.bloques.filter((b) => b.materiaCodigo !== materiaCodigo);
    set((s) => ({
      horario: s.horario ? { ...s.horario, bloques: nuevosBloques } : null,
    }));

    try {
      await HorarioService.removeBloque(horario.id, materiaCodigo);
    } catch {
      set((s) => ({
        horario: s.horario ? { ...s.horario, bloques: horario.bloques } : null,
      }));
    }
  },

  marcarResultado: async (materiaCodigo, aprobada) => {
    const { horario } = get();
    if (!horario) return;
    await HorarioService.marcarResultado(horario.id, materiaCodigo, aprobada);
  },

  finalizar: async () => {
    const { horario } = get();
    if (!horario) return;
    await HorarioService.finalizar(horario.id);
    set({
      horario: { ...horario, estado: "finalizado", finalizadoAt: new Date().toISOString() },
    });
  },

  clear: () => {
    set({ horario: null, error: null });
    get().storage.remove();
  },
}));
