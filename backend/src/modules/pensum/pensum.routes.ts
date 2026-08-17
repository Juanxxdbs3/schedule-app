import { Router } from "express";
import { PensumController } from "./pensum.controller.js";
import { authGuard } from "../../shared/middlewares/authGuard.js";

export function createPensumRouter(pensumController: PensumController): Router {
  const router = Router();

  router.post("/", authGuard, pensumController.createHandler);
  router.get("/", authGuard, pensumController.listHandler);
  router.post("/:id/materias", authGuard, pensumController.agregarMateriaHandler);
  router.get("/:id", authGuard, pensumController.getByIdHandler);
  router.patch("/:id/materias/:codigo/estado", authGuard, pensumController.updateMateriaEstadoHandler);
  router.delete("/:id", authGuard, pensumController.deleteHandler);

  return router;
}
