import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError.js";
import mongoose from "mongoose";

export function errorHandler(
  err: Error & { code?: number },
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  if (err.code === 11000) {
    res.status(409).json({ error: "El nombre de usuario o email ya está en uso" });
    return;
  }

  if (err instanceof mongoose.Error.ValidationError) {
    res.status(400).json({ error: "Validation error: " + err.message });
    return;
  }

  if (err instanceof mongoose.Error.CastError) {
    res.status(400).json({ error: "ID inválido: " + err.value });
    return;
  }

  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
}
