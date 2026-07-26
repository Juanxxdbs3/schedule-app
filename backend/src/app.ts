import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import { env } from "./config/env.js";
import { UserRepositoryMongo } from "./modules/auth/auth.repository.mongo.js";
import { AuthService } from "./modules/auth/auth.service.js";
import { AuthController } from "./modules/auth/auth.controller.js";
import { createAuthRouter } from "./modules/auth/auth.routes.js";
import { errorHandler } from "./shared/middlewares/errorHandler.js";

// --- Wiring (DI manual) ---
const userRepo = new UserRepositoryMongo();
const authService = new AuthService(userRepo);
const authController = new AuthController(authService);
const authRouter = createAuthRouter(authController);

// --- Express app ---
const app = express();

app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// --- Routes ---
app.use("/api/auth", authRouter);

// --- Error handler (must be last) ---
app.use(errorHandler);

export { app };
