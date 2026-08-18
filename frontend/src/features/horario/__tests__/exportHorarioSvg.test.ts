import { describe, it, expect } from "vitest";
import { generarSvgHorario } from "../utils/exportHorarioSvg";
import type { Bloque, DiaSemana } from "../types";
import type { Materia } from "../../pensum/types";

const MATEMATICAS: Materia = {
  codigo: "M1",
  nombre: "Matemáticas",
  creditos: 4,
  semestre: 1,
  requiere: [],
  estado: "activo",
};

const FISICA: Materia = {
  codigo: "M2",
  nombre: "Física",
  creditos: 3,
  semestre: 1,
  requiere: [],
  estado: "matriculado",
};

const BLOQUES: Bloque[] = [
  { id: "b1", materiaCodigo: "M1", dia: "lunes", horaInicio: "07:00", horaFin: "10:00", profesor: "Dr. X", salon: "A-101" },
  { id: "b2", materiaCodigo: "M2", dia: "martes", horaInicio: "08:00", horaFin: "09:00" },
];

const DIAS: DiaSemana[] = ["lunes", "martes", "miercoles"];

describe("generarSvgHorario", () => {
  it("devuelve un SVG válido con los labels de los días", () => {
    const svg = generarSvgHorario(BLOQUES, [MATEMATICAS, FISICA], DIAS, 60, { M1: "aprobada" });
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg).toContain("</svg>");
    expect(svg).toContain("Lun");
    expect(svg).toContain("Mar");
    expect(svg).toContain("Mié");
  });

  it("genera un rectángulo por bloque", () => {
    const svg = generarSvgHorario(BLOQUES, [MATEMATICAS, FISICA], DIAS, 60);
    const count = (svg.match(/class="bloque"/g) || []).length;
    expect(count).toBe(BLOQUES.length);
  });

  it("no incluye bloques de días que no están en la lista", () => {
    const svg = generarSvgHorario(BLOQUES, [MATEMATICAS, FISICA], ["lunes"], 60);
    const count = (svg.match(/class="bloque"/g) || []).length;
    expect(count).toBe(1);
  });

  it("incluye nombre de la materia, profesor, salón y resultado aprobada", () => {
    const svg = generarSvgHorario(BLOQUES, [MATEMATICAS, FISICA], DIAS, 60, { M1: "aprobada" });
    expect(svg).toContain("Matemáticas");
    expect(svg).toContain("Dr. X");
    expect(svg).toContain("A-101");
    expect(svg).toContain("Aprobada");
    expect(svg).not.toContain("Perdida");
  });

  it("marca resultado perdida y escapa caracteres especiales", () => {
    const rara: Materia = { ...MATEMATICAS, codigo: "M3", nombre: "A<B>C & D" };
    const bloques: Bloque[] = [{ id: "b3", materiaCodigo: "M3", dia: "viernes", horaInicio: "14:00", horaFin: "15:00" }];
    const svg = generarSvgHorario(bloques, [rara], ["viernes"], 60, { M3: "perdida" });
    expect(svg).toContain("Perdida");
    expect(svg).toContain("&lt;");
    expect(svg).toContain("&gt;");
    expect(svg).toContain("&amp;");
  });
});
