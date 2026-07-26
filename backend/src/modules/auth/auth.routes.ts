import { Router } from "express";
import { AuthController } from "./auth.controller.js";
import { authGuard } from "../../shared/middlewares/authGuard.js";

export function createAuthRouter(authController: AuthController): Router {
  const router = Router();

  router.post("/register", authController.registerHandler);
  router.post("/login", authController.loginHandler);
  router.post("/logout", authController.logoutHandler);
  router.get("/me", authGuard, authController.meHandler);

  return router;
}
