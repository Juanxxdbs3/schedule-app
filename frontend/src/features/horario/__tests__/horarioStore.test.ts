import { describe, it, expect, beforeEach } from "vitest";
import { useHorarioStore } from "../store/horarioStore";
import type { Bloque, DiaSemana } from "../types";
import type { Materia } from "../../pensum/types";

const MATERIA: Materia = { codigo: "M1", nombre: "Matemáticas", creditos: 3, semestre: 1, requiere: [], estado: "activo" };

function makeBloque(id: string, dia: DiaSemana, inicio: string, fin: string): Bloque {
  return { id, materiaCodigo: MATERIA.codigo, dia, horaInicio: inicio, horaFin: fin };
}

function setup(bloques: Bloque[]) {
  useHorarioStore.getState().initNuevoHorario("pensum-1", "2026-1", 30, 60);
  for (const b of bloques) {
    const r = useHorarioStore.getState().addBloqueLocal(b, [MATERIA]);
    if (!r.ok) throw new Error(r.error);
  }
}

beforeEach(() => {
  useHorarioStore.setState({ horario: null, loading: false, error: null });
});

describe("shrinkBloqueTop", () => {
  it("retrasa el inicio una unidad y reduce la duración", () => {
    setup([makeBloque("b1", "lunes", "07:00", "10:00")]);

    const r = useHorarioStore.getState().shrinkBloqueTop("b1", [MATERIA]);
    expect(r.ok).toBe(true);

    const b = useHorarioStore.getState().horario!.bloques[0];
    expect(b.horaInicio).toBe("08:00");
    expect(b.horaFin).toBe("10:00");
  });

  it("rechaza cuando el bloque ya tiene 1 unidad y no lo modifica", () => {
    setup([makeBloque("b1", "lunes", "07:00", "08:00")]);

    const r = useHorarioStore.getState().shrinkBloqueTop("b1", [MATERIA]);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("Mínimo 1 unidad");

    const b = useHorarioStore.getState().horario!.bloques[0];
    expect(b.horaInicio).toBe("07:00");
    expect(b.horaFin).toBe("08:00");
  });
});

describe("shrinkBloqueBottom", () => {
  it("adelanta el fin una unidad y reduce la duración", () => {
    setup([makeBloque("b1", "lunes", "07:00", "10:00")]);

    const r = useHorarioStore.getState().shrinkBloqueBottom("b1", [MATERIA]);
    expect(r.ok).toBe(true);

    const b = useHorarioStore.getState().horario!.bloques[0];
    expect(b.horaInicio).toBe("07:00");
    expect(b.horaFin).toBe("09:00");
  });

  it("rechaza cuando el bloque ya tiene 1 unidad y no lo modifica", () => {
    setup([makeBloque("b1", "lunes", "07:00", "08:00")]);

    const r = useHorarioStore.getState().shrinkBloqueBottom("b1", [MATERIA]);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("Mínimo 1 unidad");

    const b = useHorarioStore.getState().horario!.bloques[0];
    expect(b.horaInicio).toBe("07:00");
    expect(b.horaFin).toBe("08:00");
  });
});

describe("bloque duplicado", () => {
  it("reduce a 1 hora un bloque de 3 horas duplicado en otro día", () => {
    setup([
      makeBloque("original", "lunes", "07:00", "10:00"),
      makeBloque("duplicado", "martes", "07:00", "10:00"),
    ]);

    const s = useHorarioStore.getState();
    expect(s.shrinkBloqueTop("duplicado", [MATERIA]).ok).toBe(true);
    expect(s.shrinkBloqueTop("duplicado", [MATERIA]).ok).toBe(true);
    expect(s.shrinkBloqueTop("duplicado", [MATERIA]).ok).toBe(false);

    const bloques = useHorarioStore.getState().horario!.bloques;
    const dup = bloques.find((b) => b.id === "duplicado")!;
    expect(dup.horaInicio).toBe("09:00");
    expect(dup.horaFin).toBe("10:00");

    const orig = bloques.find((b) => b.id === "original")!;
    expect(orig.horaInicio).toBe("07:00");
    expect(orig.horaFin).toBe("10:00");
  });
});

describe("errores", () => {
  it("devuelve error si el bloque no existe", () => {
    setup([]);

    const top = useHorarioStore.getState().shrinkBloqueTop("no-existe", [MATERIA]);
    expect(top.ok).toBe(false);
    if (!top.ok) expect(top.error).toContain("Bloque no encontrado");

    const bottom = useHorarioStore.getState().shrinkBloqueBottom("no-existe", [MATERIA]);
    expect(bottom.ok).toBe(false);
  });
});