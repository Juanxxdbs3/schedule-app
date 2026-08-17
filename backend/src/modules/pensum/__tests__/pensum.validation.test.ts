import { describe, it, expect } from "vitest";
import { createPensumSchema } from "../pensum.validation.js";

describe("createPensumSchema", () => {
  it("permite crear un pensum sin materias (array vacío)", () => {
    const parsed = createPensumSchema.parse({ nombre: "Carrera", materias: [] });
    expect(parsed.materias).toEqual([]);
  });

  it("permite omitir materias y las deja en array vacío", () => {
    const parsed = createPensumSchema.parse({ nombre: "Carrera" });
    expect(parsed.materias).toEqual([]);
  });

  it("valida cada materia cuando se envían", () => {
    const parsed = createPensumSchema.parse({
      nombre: "Carrera",
      materias: [{ codigo: "MAT101", nombre: "Matemáticas", creditos: 3, semestre: 1, requiere: [], estado: "activo" }],
    });
    expect(parsed.materias).toHaveLength(1);
  });

  it("rechaza materias inválidas", () => {
    const result = createPensumSchema.safeParse({ nombre: "Carrera", materias: [{ codigo: "" }] });
    expect(result.success).toBe(false);
  });

  it("requiere nombre", () => {
    const result = createPensumSchema.safeParse({ materias: [] });
    expect(result.success).toBe(false);
  });
});