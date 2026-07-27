import { describe, it, expect } from "vitest";
import { SimpleConflictDetectionStrategy } from "../strategies/SimpleConflictDetectionStrategy.ts";
import type { Bloque } from "../types.ts";

function makeBloque(id: string, materiaCodigo: string, dia: string, horaInicio: string, horaFin: string): Bloque {
  return { id, materiaCodigo, dia: dia as any, horaInicio, horaFin };
}

describe("SimpleConflictDetectionStrategy (frontend)", () => {
  const strategy = new SimpleConflictDetectionStrategy();

  it("misma materia, mismo día, misma hora → conflicto (dos bloques distintos)", () => {
    const nuevo = makeBloque("b1", "M1", "lunes", "08:00", "10:00");
    const existentes = [makeBloque("b2", "M1", "lunes", "08:00", "10:00")];
    expect(strategy.hayChoque(nuevo, existentes)).toBe(true);
  });

  it("misma materia, mismo día, no se superponen → no conflicto", () => {
    const nuevo = makeBloque("b1", "M1", "lunes", "10:00", "12:00");
    const existentes = [makeBloque("b2", "M1", "lunes", "08:00", "10:00")];
    expect(strategy.hayChoque(nuevo, existentes)).toBe(false);
  });

  it("misma materia, días distintos → no conflicto", () => {
    const nuevo = makeBloque("b1", "M1", "lunes", "08:00", "10:00");
    const existentes = [makeBloque("b2", "M1", "martes", "08:00", "10:00")];
    expect(strategy.hayChoque(nuevo, existentes)).toBe(false);
  });

  it("mismo bloque contra sí mismo → no conflicto", () => {
    const bloque = makeBloque("b1", "M1", "lunes", "08:00", "10:00");
    expect(strategy.hayChoque(bloque, [bloque])).toBe(false);
  });

  it("distintas materias, mismo día, se superponen → conflicto", () => {
    const nuevo = makeBloque("b1", "M1", "lunes", "08:00", "10:00");
    const existentes = [makeBloque("b2", "M2", "lunes", "09:00", "11:00")];
    expect(strategy.hayChoque(nuevo, existentes)).toBe(true);
  });
});
