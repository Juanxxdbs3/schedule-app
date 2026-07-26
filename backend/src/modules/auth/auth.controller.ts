import { Request, Response, NextFunction } from "express";
import { AuthService } from "./auth.service.js";

export class AuthController {
  constructor(private authService: AuthService) {}

  registerHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { username, email, password } = req.body;

      if (!username || !email || !password) {
        res.status(400).json({ error: "username, email y password son requeridos" });
        return;
      }

      const user = await this.authService.register(username, email, password);
      res.status(201).json({ user });
    } catch (error) {
      next(error);
    }
  };

  loginHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: "email y password son requeridos" });
        return;
      }

      const user = await this.authService.login(email, password, res);
      res.json({ user });
    } catch (error) {
      next(error);
    }
  };

  meHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).userId;
      const user = await this.authService.me(userId);
      res.json({ user });
    } catch (error) {
      next(error);
    }
  };

  logoutHandler = (_req: Request, res: Response): void => {
    res.clearCookie("token", { path: "/" });
    res.json({ message: "Sesión cerrada exitosamente" });
  };
}
