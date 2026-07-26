import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Response } from "express";
import { IUserRepository } from "../../domain/interfaces/index.js";
import { Usuario } from "../../domain/entities/index.js";
import { env } from "../../config/env.js";
import { ValidationError, NotFoundError } from "../../shared/errors/AppError.js";

const BCRYPT_ROUNDS = 10;
const COOKIE_NAME = "token";
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

export class AuthService {
  constructor(private userRepo: IUserRepository) {}

  async register(username: string, email: string, password: string): Promise<Usuario> {
    const existing = await this.userRepo.findByEmail(email);
    if (existing) {
      throw new ValidationError("El email ya está registrado");
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = await this.userRepo.create({ username, email, passwordHash });
    return user;
  }

  async login(email: string, password: string, res: Response): Promise<Usuario> {
    const doc = await this.userRepo.findByEmailWithPassword(email);

    if (!doc) {
      throw new NotFoundError("Credenciales inválidas");
    }

    const passwordMatch = await bcrypt.compare(password, doc.passwordHash);
    if (!passwordMatch) {
      throw new NotFoundError("Credenciales inválidas");
    }

    const token = jwt.sign({ userId: doc.id }, env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });

    return {
      id: doc.id,
      username: doc.username,
      email: doc.email,
      createdAt: doc.createdAt,
    };
  }

  async me(userId: string): Promise<Usuario> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError("Usuario no encontrado");
    }
    return user;
  }
}
