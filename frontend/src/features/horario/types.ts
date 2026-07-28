export type DiaSemana = 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo';
export type EstadoHorario = 'en_progreso' | 'finalizado';

export interface Bloque {
  id: string;
  materiaCodigo: string;
  dia: DiaSemana;
  horaInicio: string;
  horaFin: string;
  nombrePersonalizado?: string;
  profesor?: string;
  salon?: string;
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
  resultados: Record<string, 'aprobada' | 'perdida'>;
  createdAt: string;
  finalizadoAt: string | null;
}
