import { describe, it, expect } from "vitest";
import { SimpleCreditLimitStrategy } from "../strategies/impl/SimpleCreditLimitStrategy.js";
import type { Bloque, Materia } from "../../../domain/entities/index.js";

function makeMateria(codigo: string, creditos: number): Materia {
  return { codigo, nombre: `Materia ${codigo}`, creditos, semestre: 1, requiere: [], estado: "activo" };
}

function makeBloque(materiaCodigo: string, dia = "lunes", horaInicio = "08:00", horaFin = "10:00"): Bloque {
  return { materiaCodigo, dia: dia as any, horaInicio, horaFin };
}

describe("SimpleCreditLimitStrategy", () => {
  const strategy = new SimpleCreditLimitStrategy();

  it("cuenta créditos por materia única, no por bloque", () => {
    const materias = [makeMateria("M1", 3)];
    const bloques = [
      makeBloque("M1", "lunes"),
      makeBloque("M1", "martes"),  // misma materia, otro día
    ];
    // Si contara por bloque: 3+3=6 → false (max=5)
    // Si cuenta única: 3 → true (max=5)
    expect(strategy.validar(bloques, materias, 5)).toBe(true);
    expect(strategy.validar(bloques, materias, 2)).toBe(false);
    expect(strategy.validar(bloques, materias, 3)).toBe(true);
  });

  it("suma créditos de varias materias distintas correctamente", () => {
    const materias = [
      makeMateria("M1", 3),
      makeMateria("M2", 4),
    ];
    const bloques = [
      makeBloque("M1"),
      makeBloque("M2", "martes"),
    ];
    // 3 + 4 = 7
    expect(strategy.validar(bloques, materias, 7)).toBe(true);
    expect(strategy.validar(bloques, materias, 6)).toBe(false);
  });

  it("3 bloques de la misma materia cuentan como 1 sola materia", () => {
    const materias = [makeMateria("X", 5)];
    const bloques = [
      makeBloque("X", "lunes"),
      makeBloque("X", "martes"),
      makeBloque("X", "miercoles"),
    ];
    expect(strategy.validar(bloques, materias, 5)).toBe(true);
    expect(strategy.validar(bloques, materias, 4)).toBe(false);
  });

  it("lanza ValidationError si bloques no es array", () => {
    const materias = [makeMateria("M1", 3)];
    expect(() => strategy.validar(null as unknown as Bloque[], materias, 10)).toThrow();
    expect(() => strategy.validar("no-array" as unknown as Bloque[], materias, 10)).toThrow();
  });
});
