import type { Materia } from "../../features/pensum/types.ts";

export function filtrarMaterias(
  materias: Materia[],
  nombre: string,
  semestre: number | "",
  creditosMax: number | ""
): Materia[] {
  return materias.filter((m) => {
    if (nombre && !m.nombre.toLowerCase().includes(nombre.toLowerCase())) return false;
    if (semestre !== "" && m.semestre !== semestre) return false;
    if (creditosMax !== "" && m.creditos > creditosMax) return false;
    return true;
  });
}
