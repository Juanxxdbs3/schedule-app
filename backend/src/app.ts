import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import { env } from "./config/env.js";
import { UserRepositoryMongo } from "./modules/auth/auth.repository.mongo.js";
import { AuthService } from "./modules/auth/auth.service.js";
import { AuthController } from "./modules/auth/auth.controller.js";
import { createAuthRouter } from "./modules/auth/auth.routes.js";
import { PensumRepositoryMongo } from "./modules/pensum/pensum.repository.mongo.js";
import { PensumService } from "./modules/pensum/pensum.service.js";
import { PensumController } from "./modules/pensum/pensum.controller.js";
import { createPensumRouter } from "./modules/pensum/pensum.routes.js";
import { errorHandler } from "./shared/middlewares/errorHandler.js";
import { HorarioRepositoryMongo } from "./modules/horario/horario.repository.mongo.js";
import { SimpleCreditLimitStrategy } from "./modules/horario/strategies/impl/SimpleCreditLimitStrategy.js";
import { SimpleConflictDetectionStrategy } from "./modules/horario/strategies/impl/SimpleConflictDetectionStrategy.js";
import { HorarioService } from "./modules/horario/horario.service.js";
import { HorarioController } from "./modules/horario/horario.controller.js";
import { createHorarioRouter } from "./modules/horario/horario.routes.js";

// --- Wiring (DI manual) ---
const userRepo = new UserRepositoryMongo();
const authService = new AuthService(userRepo);
const authController = new AuthController(authService);
const authRouter = createAuthRouter(authController);

const pensumRepo = new PensumRepositoryMongo();
const pensumService = new PensumService(pensumRepo);
const pensumController = new PensumController(pensumService);
const pensumRouter = createPensumRouter(pensumController);

const horarioRepo = new HorarioRepositoryMongo();
const creditLimitStrategy = new SimpleCreditLimitStrategy();
const conflictStrategy = new SimpleConflictDetectionStrategy();
const horarioService = new HorarioService(horarioRepo, pensumRepo, creditLimitStrategy, conflictStrategy);
const horarioController = new HorarioController(horarioService);
const horarioRouter = createHorarioRouter(horarioController);

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
app.use("/api/pensums", pensumRouter);
app.use("/api/horarios", horarioRouter);

// --- Error handler (must be last) ---
app.use(errorHandler);

export { app };
