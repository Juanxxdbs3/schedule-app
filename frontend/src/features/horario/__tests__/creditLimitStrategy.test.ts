import { describe, it, expect } from "vitest";
import { SimpleCreditLimitStrategy } from "../strategies/SimpleCreditLimitStrategy.ts";
import type { Bloque } from "../types.ts";
import type { Materia } from "../../pensum/types.ts";

function makeMateria(codigo: string, creditos: number): Materia {
  return { codigo, nombre: `Materia ${codigo}`, creditos, semestre: 1, requiere: [], estado: "activo" };
}

function makeBloque(materiaCodigo: string, id = "b1", dia = "lunes", horaInicio = "08:00", horaFin = "10:00"): Bloque {
  return { id, materiaCodigo, dia: dia as any, horaInicio, horaFin };
}

describe("SimpleCreditLimitStrategy (frontend)", () => {
  const strategy = new SimpleCreditLimitStrategy();

  it("cuenta créditos por materia única, no por bloque", () => {
    const materias = [makeMateria("M1", 3)];
    const bloques = [
      makeBloque("M1", "b1", "lunes"),
      makeBloque("M1", "b2", "martes"),
    ];
    expect(strategy.validar(bloques, materias, 5)).toBe(true);
    expect(strategy.validar(bloques, materias, 2)).toBe(false);
    expect(strategy.validar(bloques, materias, 3)).toBe(true);
  });

  it("suma créditos de varias materias distintas correctamente", () => {
    const materias = [makeMateria("M1", 3), makeMateria("M2", 4)];
    const bloques = [makeBloque("M1", "b1"), makeBloque("M2", "b2", "martes")];
    expect(strategy.validar(bloques, materias, 7)).toBe(true);
    expect(strategy.validar(bloques, materias, 6)).toBe(false);
  });

  it("3 bloques de la misma materia cuentan como 1 sola materia", () => {
    const materias = [makeMateria("X", 5)];
    const bloques = [
      makeBloque("X", "b1", "lunes"),
      makeBloque("X", "b2", "martes"),
      makeBloque("X", "b3", "miercoles"),
    ];
    expect(strategy.validar(bloques, materias, 5)).toBe(true);
    expect(strategy.validar(bloques, materias, 4)).toBe(false);
  });

  it("devuelve true si no hay bloques", () => {
    expect(strategy.validar([], [], 10)).toBe(true);
  });
});
