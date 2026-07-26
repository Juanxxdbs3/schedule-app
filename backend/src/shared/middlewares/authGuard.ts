import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";

export function authGuard(req: Request, res: Response, next: NextFunction): void {
  try {
    const token = req.cookies?.token;

    if (!token) {
      res.status(401).json({ error: "No autorizado" });
      return;
    }

    const payload = jwt.verify(token, env.JWT_SECRET) as { userId: string };
    (req as any).userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ error: "No autorizado" });
  }
}
