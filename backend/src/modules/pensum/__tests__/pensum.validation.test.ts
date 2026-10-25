import { describe, it, expect } from "vitest";
import { createPensumSchema, formatearErroresZod } from "../pensum.validation.js";

function materia(overrides: Record<string, unknown> = {}) {
  return {
    codigo: "MAT101",
    nombre: "Matemáticas",
    creditos: 3,
    semestre: 1,
    requiere: [],
    estado: "activo",
    ...overrides,
  };
}

function erroresDe(data: unknown): string[] {
  const result = createPensumSchema.safeParse(data);
  if (result.success) return [];
  return formatearErroresZod(result.error);
}

function erroresDeMaterias(materias: unknown[]): string[] {
  return erroresDe({ nombre: "Carrera", materias });
}

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
    const parsed = createPensumSchema.parse({ nombre: "Carrera", materias: [materia()] });
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

  it("acepta un pensum con códigos únicos y prerrequisitos existentes", () => {
    const errores = erroresDeMaterias([
      materia({ codigo: "MAT101" }),
      materia({ codigo: "MAT102", semestre: 2, requiere: ["MAT101"] }),
    ]);
    expect(errores).toEqual([]);
  });

  it("rechaza código vacío", () => {
    const errores = erroresDeMaterias([materia({ codigo: "   " })]);
    expect(errores.some((e) => e.includes("código no puede estar vacío"))).toBe(true);
  });

  it("rechaza código duplicado", () => {
    const errores = erroresDeMaterias([materia({ codigo: "MAT101" }), materia({ codigo: "MAT101" })]);
    expect(errores.some((e) => e.includes("repetido") && e.includes("MAT101"))).toBe(true);
  });

  it("rechaza créditos enviados como texto", () => {
    const errores = erroresDeMaterias([materia({ creditos: "3" })]);
    expect(errores.some((e) => e.includes("créditos deben ser un número"))).toBe(true);
  });

  it("rechaza créditos iguales a 0", () => {
    const errores = erroresDeMaterias([materia({ creditos: 0 })]);
    expect(errores.some((e) => e.includes("mayores que 0"))).toBe(true);
  });

  it("rechaza semestre enviado como texto o menor que 1", () => {
    const comoTexto = erroresDeMaterias([materia({ semestre: "2" })]);
    expect(comoTexto.some((e) => e.includes("semestre debe ser un número entero"))).toBe(true);

    const cero = erroresDeMaterias([materia({ semestre: 0 })]);
    expect(cero.some((e) => e.includes("semestre debe ser 1 o mayor"))).toBe(true);
  });

  it("rechaza estado fuera del enum", () => {
    const errores = erroresDeMaterias([materia({ estado: "aprobada" })]);
    expect(errores.some((e) => e.includes("estado debe ser"))).toBe(true);
  });

  it("rechaza prerrequisito con código inexistente", () => {
    const errores = erroresDeMaterias([materia({ codigo: "MAT101", requiere: ["FIS999"] })]);
    expect(errores.some((e) => e.includes("FIS999") && e.includes("no existe"))).toBe(true);
  });

  it("rechaza auto-referencia", () => {
    const errores = erroresDeMaterias([materia({ codigo: "MAT101", requiere: ["MAT101"] })]);
    expect(errores.some((e) => e.includes("propio código"))).toBe(true);
  });

  it("detecta ciclo A -> B -> A", () => {
    const errores = erroresDeMaterias([
      materia({ codigo: "A", requiere: ["B"] }),
      materia({ codigo: "B", requiere: ["A"] }),
    ]);
    const ciclo = errores.find((e) => e.includes("Ciclo"));
    expect(ciclo).toBeDefined();
    expect(ciclo).toContain("A");
    expect(ciclo).toContain("B");
  });

  it("detecta ciclos de tres materias", () => {
    const errores = erroresDeMaterias([
      materia({ codigo: "A", requiere: ["B"] }),
      materia({ codigo: "B", requiere: ["C"] }),
      materia({ codigo: "C", requiere: ["A"] }),
    ]);
    expect(errores.filter((e) => e.includes("Ciclo"))).toHaveLength(1);
  });

  it("no reporta ciclo cuando la cadena es lineal", () => {
    const errores = erroresDeMaterias([
      materia({ codigo: "A", requiere: ["B"] }),
      materia({ codigo: "B", requiere: ["C"] }),
      materia({ codigo: "C" }),
    ]);
    expect(errores.filter((e) => e.includes("Ciclo"))).toHaveLength(0);
  });

  it("acumula todos los errores a la vez, no solo el primero", () => {
    const errores = erroresDeMaterias([
      materia({ codigo: "", nombre: "" }),
      materia({ codigo: "MAT101", creditos: "3", semestre: 0 }),
      materia({ codigo: "MAT101", requiere: ["NOEXISTE"] }),
    ]);

    expect(errores.length).toBeGreaterThanOrEqual(5);
    expect(errores.some((e) => e.includes("código no puede estar vacío"))).toBe(true);
    expect(errores.some((e) => e.includes("nombre no puede estar vacío"))).toBe(true);
    expect(errores.some((e) => e.includes("créditos deben ser un número"))).toBe(true);
    expect(errores.some((e) => e.includes("semestre debe ser 1 o mayor"))).toBe(true);
    expect(errores.some((e) => e.includes("repetido"))).toBe(true);
    expect(errores.some((e) => e.includes("NOEXISTE"))).toBe(true);
  });

  it("cita el número y el campo de la materia en el mensaje", () => {
    const errores = erroresDeMaterias([materia(), materia({ codigo: "MAT102", creditos: "3" })]);
    expect(errores.some((e) => e.includes("Materia 2 (creditos)"))).toBe(true);
  });

  it("ignora claves extra sin fallar", () => {
    const errores = erroresDeMaterias([materia({ profesor: "Juan", salon: "B201" })]);
    expect(errores).toEqual([]);
  });
});
