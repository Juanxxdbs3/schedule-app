import { Router } from "express";
import { HorarioController } from "./horario.controller.js";
import { authGuard } from "../../shared/middlewares/authGuard.js";

export function createHorarioRouter(horarioController: HorarioController): Router {
  const router = Router();

  router.post("/", authGuard, horarioController.createHandler);
  router.get("/", authGuard, horarioController.listHandler);
  router.get("/:id", authGuard, horarioController.getByIdHandler);
  router.patch("/:id/bloques", authGuard, horarioController.addBloqueHandler);
  router.delete("/:id/bloques/:materiaCodigo", authGuard, horarioController.removeBloqueHandler);
  router.patch("/:id/resultados", authGuard, horarioController.marcarResultadoHandler);
  router.patch("/:id/finalizar", authGuard, horarioController.finalizarHandler);
  router.delete("/:id", authGuard, horarioController.deleteHandler);

  return router;
}
