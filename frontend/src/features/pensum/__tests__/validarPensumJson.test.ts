import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { validarPensumJson } from "../utils/validarPensumJson.ts";

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

function pensum(materias: unknown[]) {
  return { nombre: "Carrera", materias };
}

function erroresDe(data: unknown): string[] {
  const resultado = validarPensumJson(data);
  return resultado.ok ? [] : resultado.errores;
}

describe("validarPensumJson", () => {
  it("acepta un JSON válido y devuelve el resumen", () => {
    const resultado = validarPensumJson(
      pensum([
        materia({ codigo: "MAT101", creditos: 3, semestre: 1 }),
        materia({ codigo: "MAT102", creditos: 4, semestre: 2, requiere: ["MAT101"] }),
        materia({ codigo: "FIS101", creditos: 2, semestre: 2 }),
      ]),
    );

    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;

    expect(resultado.data.nombre).toBe("Carrera");
    expect(resultado.data.materias).toHaveLength(3);
    expect(resultado.resumen).toEqual({
      materias: 3,
      creditosTotales: 9,
      semestres: 2,
      conPrerrequisitos: 1,
    });
  });

  it("cuenta 0 materias con prerrequisitos cuando ninguna los tiene", () => {
    const resultado = validarPensumJson(pensum([materia()]));

    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;
    expect(resultado.resumen.conPrerrequisitos).toBe(0);
  });

  it("ignora claves extra en las materias", () => {
    const resultado = validarPensumJson(pensum([materia({ profesor: "Juan", salon: "B201" })]));
    expect(resultado.ok).toBe(true);
  });

  it("rechaza código vacío", () => {
    const errores = erroresDe(pensum([materia({ codigo: "   " })]));
    expect(errores.some((e) => e.includes("'codigo' no puede estar vacío"))).toBe(true);
  });

  it("rechaza código duplicado citando las dos materias", () => {
    const errores = erroresDe(pensum([materia({ codigo: "MAT101" }), materia({ codigo: "MAT101" })]));
    const duplicado = errores.find((e) => e.includes("repetido"));
    expect(duplicado).toBeDefined();
    expect(duplicado).toContain("MAT101");
    expect(duplicado).toContain("materia 1");
  });

  it("rechaza créditos enviados como texto", () => {
    const errores = erroresDe(pensum([materia({ creditos: "3" })]));
    expect(errores.some((e) => e.includes("'creditos' debe ser un número"))).toBe(true);
  });

  it("rechaza créditos iguales a 0", () => {
    const errores = erroresDe(pensum([materia({ creditos: 0 })]));
    expect(errores.some((e) => e.includes("mayor que 0"))).toBe(true);
  });

  it("rechaza semestre como texto y semestre menor que 1", () => {
    const comoTexto = erroresDe(pensum([materia({ semestre: "2" })]));
    expect(comoTexto.some((e) => e.includes("'semestre' debe ser un número entero"))).toBe(true);

    const cero = erroresDe(pensum([materia({ semestre: 0 })]));
    expect(cero.some((e) => e.includes("'semestre' debe ser 1 o mayor"))).toBe(true);
  });

  it("rechaza estado fuera del enum", () => {
    const errores = erroresDe(pensum([materia({ estado: "aprobada" })]));
    expect(errores.some((e) => e.includes("'estado' debe ser"))).toBe(true);
  });

  it("rechaza prerrequisito con código inexistente", () => {
    const errores = erroresDe(pensum([materia({ codigo: "MAT101", requiere: ["FIS999"] })]));
    expect(errores.some((e) => e.includes("FIS999") && e.includes("no existe"))).toBe(true);
  });

  it("rechaza auto-referencia", () => {
    const errores = erroresDe(pensum([materia({ codigo: "MAT101", requiere: ["MAT101"] })]));
    expect(errores.some((e) => e.includes("propio código"))).toBe(true);
  });

  it("detecta ciclo A -> B -> A", () => {
    const errores = erroresDe(
      pensum([
        materia({ codigo: "A", requiere: ["B"] }),
        materia({ codigo: "B", requiere: ["A"] }),
      ]),
    );
    const ciclo = errores.find((e) => e.includes("Ciclo"));
    expect(ciclo).toBeDefined();
    expect(ciclo).toContain("A");
    expect(ciclo).toContain("B");
  });

  it("no reporta ciclo en una cadena lineal", () => {
    const errores = erroresDe(
      pensum([
        materia({ codigo: "A", requiere: ["B"] }),
        materia({ codigo: "B", requiere: ["C"] }),
        materia({ codigo: "C" }),
      ]),
    );
    expect(errores.filter((e) => e.includes("Ciclo"))).toHaveLength(0);
  });

  it("rechaza una clave faltante citando la materia", () => {
    const incompleta = { codigo: "MAT101", nombre: "Matemáticas", creditos: 3, semestre: 1, requiere: [] };
    const errores = erroresDe(pensum([incompleta]));
    expect(errores.some((e) => e.includes("Materia 1 (MAT101)") && e.includes("estado"))).toBe(true);
  });

  it("acumula todos los errores a la vez, no solo el primero", () => {
    const errores = erroresDe(
      pensum([
        materia({ codigo: "", nombre: "" }),
        materia({ codigo: "MAT101", creditos: "3", semestre: 0 }),
        materia({ codigo: "MAT101", requiere: ["NOEXISTE"] }),
      ]),
    );

    expect(errores.length).toBeGreaterThanOrEqual(5);
    expect(errores.some((e) => e.includes("'codigo' no puede estar vacío"))).toBe(true);
    expect(errores.some((e) => e.includes("'nombre' no puede estar vacío"))).toBe(true);
    expect(errores.some((e) => e.includes("'creditos' debe ser un número"))).toBe(true);
    expect(errores.some((e) => e.includes("'semestre' debe ser 1 o mayor"))).toBe(true);
    expect(errores.some((e) => e.includes("repetido"))).toBe(true);
    expect(errores.some((e) => e.includes("NOEXISTE"))).toBe(true);
  });

  it("rechaza raíces que no son objeto", () => {
    expect(erroresDe(null).length).toBeGreaterThan(0);
    expect(erroresDe([]).length).toBeGreaterThan(0);
    expect(erroresDe("texto").length).toBeGreaterThan(0);
  });

  it("rechaza un pensum sin materias o con 'materias' que no es lista", () => {
    expect(erroresDe({ nombre: "Carrera", materias: [] }).some((e) => e.includes("no tiene materias"))).toBe(true);
    expect(erroresDe({ nombre: "Carrera", materias: "x" }).some((e) => e.includes("debe ser una lista"))).toBe(true);
  });

  it("rechaza nombre vacío o ausente", () => {
    expect(erroresDe({ nombre: "  ", materias: [materia()] }).some((e) => e.includes("'nombre' no puede estar vacío"))).toBe(true);
    expect(erroresDe({ materias: [materia()] }).some((e) => e.includes("Falta la clave 'nombre'"))).toBe(true);
  });

  it("acepta el ejemplo canónico docs/formato-pensum.json", () => {
    const url = new URL("../../../../../docs/formato-pensum.json", import.meta.url);
    const json = JSON.parse(readFileSync(url, "utf8")) as unknown;

    const resultado = validarPensumJson(json);
    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;

    expect(resultado.resumen.materias).toBe(8);
    expect(resultado.resumen.semestres).toBe(3);
    expect(resultado.resumen.conPrerrequisitos).toBe(6);
  });
});
