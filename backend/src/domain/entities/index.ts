export type EstadoMateria = 'activo' | 'matriculado' | 'cursado' | 'en_espera';
export type EstadoHorario = 'en_progreso' | 'finalizado';
export type DiaSemana = 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo';

export interface Usuario {
  id: string;
  username: string;
  email: string;
  createdAt: Date;
}

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
  createdAt: Date;
  updatedAt: Date;
}

export interface Bloque {
  id?: string;
  materiaCodigo: string;
  dia: DiaSemana;
  horaInicio: string;
  horaFin: string;
  nombrePersonalizado?: string;
  profesor?: string;
  salon?: string;
}

export interface Horario {
  id: string;
  userId: string;
  pensumId: string;
  semestreLabel: string;
  maxCreditos: number;
  unidadHoraMinutos: number;
  estado: EstadoHorario;
  bloques: Bloque[];
  resultados: Record<string, 'aprobada' | 'perdida'>;
  createdAt: Date;
  finalizadoAt: Date | null;
}
