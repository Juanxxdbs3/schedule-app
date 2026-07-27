export type DiaSemana = 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo';
export type EstadoHorario = 'en_progreso' | 'finalizado';

export interface Bloque {
  materiaCodigo: string;
  dia: DiaSemana;
  horaInicio: string;
  horaFin: string;
}

export type ModoHorario = "edicion" | "curso" | "finalizado";

export interface Horario {
  id: string;
  userId: string;
  pensumId: string;
  semestreLabel: string;
  maxCreditos: number;
  unidadHoraMinutos: number;
  estado: EstadoHorario;
  bloques: Bloque[];
  createdAt: string;
  finalizadoAt: string | null;
}
