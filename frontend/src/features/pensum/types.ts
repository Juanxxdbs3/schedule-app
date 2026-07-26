export type EstadoMateria = "activo" | "matriculado" | "cursado" | "en_espera";

export interface Materia {
  codigo: string;
  nombre: string;
  creditos: number;
  semestre: number;
  requiere: string[];
  estado: EstadoMateria;
}

export interface Pensum {
  id: string;
  userId: string;
  nombre: string;
  materias: Materia[];
  createdAt: string;
  updatedAt: string;
}
