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

/* eslint-disable @typescript-eslint/no-empty-object-type */
export interface IPensumRepository {}
export interface IHorarioRepository {}
