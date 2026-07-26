import { Usuario } from "../entities/index.js";

export interface UserWithPasswordHash extends Usuario {
  passwordHash: string;
}

export interface IUserRepository {
  findByEmail(email: string): Promise<Usuario | null>;
  findByEmailWithPassword(email: string): Promise<UserWithPasswordHash | null>;
  findById(id: string): Promise<Usuario | null>;
  create(data: { username: string; email: string; passwordHash: string }): Promise<Usuario>;
}

import { Pensum, Materia, EstadoMateria } from "../entities/index.js";

export interface IPensumRepository {
  findAllByUserId(userId: string): Promise<Pensum[]>;
  findById(id: string): Promise<Pensum | null>;
  create(data: { userId: string; nombre: string; materias: Materia[] }): Promise<Pensum>;
  updateMateriaEstado(pensumId: string, materiaCodigo: string, nuevoEstado: EstadoMateria): Promise<void>;
  delete(id: string): Promise<void>;
}

import { Horario, Bloque } from "../entities/index.js";

export interface IHorarioRepository {
  findByUserId(userId: string): Promise<Horario[]>;
  findById(id: string): Promise<Horario | null>;
  create(data: {
    userId: string;
    pensumId: string;
    semestreLabel: string;
    maxCreditos: number;
    unidadHoraMinutos: number;
  }): Promise<Horario>;
  addBloque(horarioId: string, bloque: Bloque): Promise<void>;
  removeBloque(horarioId: string, materiaCodigo: string): Promise<void>;
  finalizar(horarioId: string, finalizadoAt: Date): Promise<void>;
  delete(id: string): Promise<void>;
}
