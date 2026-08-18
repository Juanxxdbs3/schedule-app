import { create } from "zustand";
import type { Horario, Bloque } from "../types.ts";
import type { Materia } from "../../pensum/types.ts";
import { SimpleCreditLimitStrategy } from "../strategies/SimpleCreditLimitStrategy.ts";
import { SimpleConflictDetectionStrategy } from "../strategies/SimpleConflictDetectionStrategy.ts";
import { HorarioService } from "../services/HorarioService.ts";
import { WebLocalStorageHorarioRepository } from "../repositories/WebLocalStorageHorarioRepository.ts";
import type { IHorarioStorageRepository } from "../repositories/IHorarioStorageRepository.ts";
import { useUiStatusStore, type UiStatus } from "../../../shared/store/uiStatusStore.ts";

function setStatus(status: UiStatus, message?: string) {
  useUiStatusStore.getState().setStatus(status, message);
}

type AddBloqueResult = { ok: true } | { ok: false; error: string };

function aMinutos(h: string): number {
  const [hh, mm] = h.split(":").map(Number);
  return hh * 60 + mm;
}

function fmt(m: number): string {
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

function generarId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

interface HorarioState {
  horario: Horario | null;
  loading: boolean;
  error: string | null;
  storage: IHorarioStorageRepository;

  setHorario: (h: Horario) => void;
  fetchHorarios: (pensumId: string) => Promise<void>;
  initNuevoHorario: (pensumId: string, semestreLabel: string, maxCreditos: number, unidadHoraMinutos: number) => Horario;
  initHorarioReal: (h: Horario) => void;

  addBloqueLocal: (bloque: Bloque, materias: Materia[]) => AddBloqueResult;
  removeBloqueLocal: (bloqueId: string) => void;
  updateBloqueLocal: (bloqueId: string, updates: Partial<Pick<Bloque, 'nombrePersonalizado' | 'profesor' | 'salon'>>) => void;
  moveBloqueLocal: (bloque: Bloque, materias: Materia[]) => AddBloqueResult;
  expandBloqueDown: (bloqueId: string, materias: Materia[]) => AddBloqueResult;
  expandBloqueUp: (bloqueId: string, materias: Materia[]) => AddBloqueResult;
  shrinkBloqueTop: (bloqueId: string, materias: Materia[]) => AddBloqueResult;
  shrinkBloqueBottom: (bloqueId: string, materias: Materia[]) => AddBloqueResult;

  saveNuevoHorario: () => Promise<Horario>;
  saveBloques: () => Promise<void>;
  fetchById: (id: string) => Promise<void>;
  marcarResultado: (materiaCodigo: string, resultado: 'aprobada' | 'perdida' | null) => Promise<void>;
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
      const res = await HorarioService.list({ pensumId });
      const h = res.horarios.find((x) => x.estado === "en_progreso") ?? res.horarios[0] ?? null;
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

  initNuevoHorario: (pensumId, semestreLabel, maxCreditos, unidadHoraMinutos) => {
    const h: Horario = {
      id: "nuevo",
      userId: "",
      pensumId,
      semestreLabel,
      maxCreditos,
      unidadHoraMinutos,
      estado: "en_progreso",
      bloques: [],
      resultados: {},
      createdAt: new Date().toISOString(),
      finalizadoAt: null,
    };
    set({ horario: h, error: null });
    return h;
  },

  initHorarioReal: (h) => {
    set({ horario: h, error: null });
    get().storage.save(h);
  },

  addBloqueLocal: (bloque, materias) => {
    const { horario } = get();
    if (!horario) return { ok: false, error: "No hay horario activo" };

    const bloqueConId: Bloque = { ...bloque, id: bloque.id || generarId() };

    if (conflictCheck.hayChoque(bloqueConId, horario.bloques)) {
      return { ok: false, error: "La materia se superpone con un bloque existente" };
    }

    const nuevosBloques = [...horario.bloques, bloqueConId];
    if (!creditLimit.validar(nuevosBloques, materias, horario.maxCreditos)) {
      return { ok: false, error: "Se excedería el límite de créditos" };
    }

    set((s) => ({
      horario: s.horario ? { ...s.horario, bloques: nuevosBloques } : null,
    }));
    return { ok: true };
  },

  removeBloqueLocal: (bloqueId) => {
    set((s) => ({
      horario: s.horario
        ? { ...s.horario, bloques: s.horario.bloques.filter((b) => b.id !== bloqueId) }
        : null,
    }));
  },

  updateBloqueLocal: (bloqueId, updates) => {
    set((s) => ({
      horario: s.horario
        ? { ...s.horario, bloques: s.horario.bloques.map((b) => (b.id === bloqueId ? { ...b, ...updates } : b)) }
        : null,
    }));
  },

  moveBloqueLocal: (bloque, materias) => {
    const { horario } = get();
    if (!horario) return { ok: false, error: "No hay horario activo" };

    const otrosBloques = horario.bloques.filter((b) => b.id !== bloque.id);

    if (conflictCheck.hayChoque(bloque, otrosBloques)) {
      return { ok: false, error: "Hay un choque de horario con otro bloque" };
    }

    const nuevosBloques = [...otrosBloques, bloque];
    if (!creditLimit.validar(nuevosBloques, materias, horario.maxCreditos)) {
      return { ok: false, error: "Se excedería el límite de créditos" };
    }

    set((s) => ({
      horario: s.horario ? { ...s.horario, bloques: nuevosBloques } : null,
    }));
    return { ok: true };
  },

  expandBloqueDown: (bloqueId, materias) => {
    const { horario } = get();
    if (!horario) return { ok: false, error: "No hay horario activo" };

    const idx = horario.bloques.findIndex((b) => b.id === bloqueId);
    if (idx === -1) return { ok: false, error: "Bloque no encontrado" };

    const original = horario.bloques[idx];
    const span = Math.round((aMinutos(original.horaFin) - aMinutos(original.horaInicio)) / horario.unidadHoraMinutos);
    if (span >= 5) return { ok: false, error: "Máximo 5 unidades de hora por materia" };

    const nuevoFin = aMinutos(original.horaFin) + horario.unidadHoraMinutos;
    if (nuevoFin > 22 * 60) return { ok: false, error: "Ya estás en la última hora del día, no puedes expandir más abajo" };

    const expandido: Bloque = { ...original, horaFin: fmt(nuevoFin) };
    const nuevosBloques = horario.bloques.map((b) => (b.id === bloqueId ? expandido : b));

    if (!creditLimit.validar(nuevosBloques, materias, horario.maxCreditos)) {
      return { ok: false, error: "Se excedería el límite de créditos" };
    }

    set((s) => ({ horario: s.horario ? { ...s.horario, bloques: nuevosBloques } : null }));
    return { ok: true };
  },

  expandBloqueUp: (bloqueId, materias) => {
    const { horario } = get();
    if (!horario) return { ok: false, error: "No hay horario activo" };

    const idx = horario.bloques.findIndex((b) => b.id === bloqueId);
    if (idx === -1) return { ok: false, error: "Bloque no encontrado" };

    const original = horario.bloques[idx];
    const span = Math.round((aMinutos(original.horaFin) - aMinutos(original.horaInicio)) / horario.unidadHoraMinutos);
    if (span >= 5) return { ok: false, error: "Máximo 5 unidades de hora por materia" };

    const nuevoInicio = aMinutos(original.horaInicio) - horario.unidadHoraMinutos;
    if (nuevoInicio < 7 * 60) return { ok: false, error: "Ya estás en la primera hora del día, no puedes expandir más arriba" };

    const expandido: Bloque = { ...original, horaInicio: fmt(nuevoInicio) };
    const nuevosBloques = horario.bloques.map((b) => (b.id === bloqueId ? expandido : b));

    if (!creditLimit.validar(nuevosBloques, materias, horario.maxCreditos)) {
      return { ok: false, error: "Se excedería el límite de créditos" };
    }

    set((s) => ({ horario: s.horario ? { ...s.horario, bloques: nuevosBloques } : null }));
    return { ok: true };
  },

  shrinkBloqueTop: (bloqueId, materias) => {
    const { horario } = get();
    if (!horario) return { ok: false, error: "No hay horario activo" };

    const idx = horario.bloques.findIndex((b) => b.id === bloqueId);
    if (idx === -1) return { ok: false, error: "Bloque no encontrado" };

    const original = horario.bloques[idx];
    const span = Math.round((aMinutos(original.horaFin) - aMinutos(original.horaInicio)) / horario.unidadHoraMinutos);
    if (span <= 1) return { ok: false, error: "Mínimo 1 unidad de hora por materia" };

    const nuevoInicio = aMinutos(original.horaInicio) + horario.unidadHoraMinutos;
    const achicado: Bloque = { ...original, horaInicio: fmt(nuevoInicio) };
    const nuevosBloques = horario.bloques.map((b) => (b.id === bloqueId ? achicado : b));

    if (!creditLimit.validar(nuevosBloques, materias, horario.maxCreditos)) {
      return { ok: false, error: "Se excedería el límite de créditos" };
    }

    set((s) => ({ horario: s.horario ? { ...s.horario, bloques: nuevosBloques } : null }));
    return { ok: true };
  },

  shrinkBloqueBottom: (bloqueId, materias) => {
    const { horario } = get();
    if (!horario) return { ok: false, error: "No hay horario activo" };

    const idx = horario.bloques.findIndex((b) => b.id === bloqueId);
    if (idx === -1) return { ok: false, error: "Bloque no encontrado" };

    const original = horario.bloques[idx];
    const span = Math.round((aMinutos(original.horaFin) - aMinutos(original.horaInicio)) / horario.unidadHoraMinutos);
    if (span <= 1) return { ok: false, error: "Mínimo 1 unidad de hora por materia" };

    const nuevoFin = aMinutos(original.horaFin) - horario.unidadHoraMinutos;
    const achicado: Bloque = { ...original, horaFin: fmt(nuevoFin) };
    const nuevosBloques = horario.bloques.map((b) => (b.id === bloqueId ? achicado : b));

    if (!creditLimit.validar(nuevosBloques, materias, horario.maxCreditos)) {
      return { ok: false, error: "Se excedería el límite de créditos" };
    }

    set((s) => ({ horario: s.horario ? { ...s.horario, bloques: nuevosBloques } : null }));
    return { ok: true };
  },

  saveNuevoHorario: async () => {
    const { horario } = get();
    if (!horario || horario.id !== "nuevo") throw new Error("No hay horario nuevo que guardar");
    set({ loading: true, error: null });
    setStatus("saving", "Guardando horario...");

    try {
      const creado = await HorarioService.create(
        horario.pensumId, horario.semestreLabel,
        horario.maxCreditos, horario.unidadHoraMinutos,
      );
      await HorarioService.saveBloques(creado.horario.id, horario.bloques);
      get().storage.save(creado.horario);
      set({ horario: creado.horario, loading: false });
      setStatus("success", "Horario creado");
      return creado.horario;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error al guardar horario";
      set({ error: msg, loading: false });
      setStatus("error", msg);
      throw e;
    }
  },

  saveBloques: async () => {
    const { horario } = get();
    if (!horario || horario.id === "nuevo") return;
    set({ loading: true, error: null });
    setStatus("saving", "Guardando cambios...");
    try {
      await HorarioService.saveBloques(horario.id, horario.bloques);
      set({ loading: false });
      setStatus("success", "Cambios guardados");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error al guardar horario";
      set({ error: msg, loading: false });
      setStatus("error", msg);
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

  marcarResultado: async (materiaCodigo, resultado) => {
    const { horario } = get();
    if (!horario) return;
    try {
      await HorarioService.marcarResultado(horario.id, materiaCodigo, resultado);
      const updated = await HorarioService.getById(horario.id);
      get().storage.save(updated.horario);
      set({ horario: updated.horario });
      setStatus("success", resultado ? (resultado === "aprobada" ? "Materia aprobada" : "Materia perdida") : "Resultado deshecho");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error al guardar resultado";
      setStatus("error", msg);
      throw e;
    }
  },

  finalizar: async () => {
    const { horario } = get();
    if (!horario) return;
    setStatus("saving", "Finalizando semestre...");
    try {
      await HorarioService.finalizar(horario.id);
      set({
        horario: { ...horario, estado: "finalizado", finalizadoAt: new Date().toISOString() },
      });
      setStatus("success", "Semestre finalizado");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error al finalizar semestre";
      setStatus("error", msg);
      throw e;
    }
  },

  clear: () => {
    set({ horario: null, error: null, loading: false });
    get().storage.remove();
  },
}));
