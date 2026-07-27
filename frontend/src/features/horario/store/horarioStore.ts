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

  addBloqueLocal: (bloque: Bloque, materias: Materia[]) => AddBloqueResult;
  removeBloqueLocal: (materiaCodigo: string) => void;
  expandBloqueLocal: (materiaCodigo: string, unidades: number, materias: Materia[]) => AddBloqueResult;

  saveBloques: () => Promise<void>;
  fetchById: (id: string) => Promise<void>;
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

  addBloqueLocal: (bloque, materias) => {
    const { horario } = get();
    if (!horario) return { ok: false, error: "No hay horario activo" };

    if (conflictCheck.hayChoque(bloque, horario.bloques)) {
      return { ok: false, error: "La materia se superpone con un bloque existente" };
    }

    const nuevosBloques = [...horario.bloques, bloque];
    if (!creditLimit.validar(nuevosBloques, materias, horario.maxCreditos)) {
      return { ok: false, error: "Se excedería el límite de créditos" };
    }

    set((s) => ({
      horario: s.horario ? { ...s.horario, bloques: nuevosBloques } : null,
    }));
    return { ok: true };
  },

  removeBloqueLocal: (materiaCodigo) => {
    set((s) => ({
      horario: s.horario
        ? { ...s.horario, bloques: s.horario.bloques.filter((b) => b.materiaCodigo !== materiaCodigo) }
        : null,
    }));
  },

  expandBloqueLocal: (materiaCodigo, unidades, materias) => {
    const { horario } = get();
    if (!horario) return { ok: false, error: "No hay horario activo" };

    const idx = horario.bloques.findIndex((b) => b.materiaCodigo === materiaCodigo);
    if (idx === -1) return { ok: false, error: "Bloque no encontrado" };

    const original = horario.bloques[idx];
    const aMinutos = (h: string) => { const [h_, m_] = h.split(":").map(Number); return h_ * 60 + m_; };
    const fmt = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

    const finActual = aMinutos(original.horaFin);
    const nuevoFin = finActual + unidades * horario.unidadHoraMinutos;
    const finMax = aMinutos(original.horaInicio) + 5 * horario.unidadHoraMinutos;

    if (nuevoFin > finMax) {
      return { ok: false, error: "Máximo 5 unidades de hora por materia" };
    }

    const expandido: Bloque = { ...original, horaFin: fmt(nuevoFin) };
    const nuevosBloques = horario.bloques.map((b) => (b.materiaCodigo === materiaCodigo ? expandido : b));

    if (!creditLimit.validar(nuevosBloques, materias, horario.maxCreditos)) {
      return { ok: false, error: "Se excedería el límite de créditos" };
    }

    set((s) => ({
      horario: s.horario ? { ...s.horario, bloques: nuevosBloques } : null,
    }));
    return { ok: true };
  },

  saveBloques: async () => {
    const { horario } = get();
    if (!horario) return;
    set({ loading: true, error: null });
    try {
      await HorarioService.saveBloques(horario.id, horario.bloques);
      set({ loading: false });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error al guardar horario";
      set({ error: msg, loading: false });
      throw e;
    }
  },

  fetchById: async (id) => {
    set({ loading: true, error: null });
    try {
      const res = await HorarioService.getById(id);
      get().storage.save(res.horario);
      set({ horario: res.horario, loading: false });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error al cargar horario";
      set({ error: msg, loading: false });
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
