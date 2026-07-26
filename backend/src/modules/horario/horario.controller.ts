import { Request, Response, NextFunction } from "express";
import { HorarioService } from "./horario.service.js";

export class HorarioController {
  constructor(private horarioService: HorarioService) {}

  createHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).userId;
      const { pensumId, semestreLabel, maxCreditos, unidadHoraMinutos } = req.body;

      const horario = await this.horarioService.create(
        userId,
        pensumId,
        semestreLabel,
        maxCreditos,
        unidadHoraMinutos,
      );

      res.status(201).json({ horario });
    } catch (error) {
      next(error);
    }
  };

  listHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).userId;
      const pensumId = req.query.pensumId as string | undefined;
      const estado = req.query.estado as string | undefined;

      const horarios = await this.horarioService.list(userId, { pensumId, estado });
      res.json({ horarios });
    } catch (error) {
      next(error);
    }
  };

  getByIdHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const horario = await this.horarioService.getById(id);
      res.json({ horario });
    } catch (error) {
      next(error);
    }
  };

  addBloqueHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const { materiaCodigo, dia, horaInicio, horaFin } = req.body;

      await this.horarioService.addBloque(id, { materiaCodigo, dia, horaInicio, horaFin });
      res.json({ message: "Bloque agregado" });
    } catch (error) {
      next(error);
    }
  };

  removeBloqueHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const materiaCodigo = req.params.materiaCodigo as string;

      await this.horarioService.removeBloque(id, materiaCodigo);
      res.json({ message: "Bloque eliminado" });
    } catch (error) {
      next(error);
    }
  };

  marcarResultadoHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const { materiaCodigo, aprobada } = req.body;

      await this.horarioService.marcarResultado(id, materiaCodigo, aprobada);
      res.json({ message: "Resultado registrado" });
    } catch (error) {
      next(error);
    }
  };

  finalizarHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;

      await this.horarioService.finalizar(id);
      res.json({ message: "Horario finalizado" });
    } catch (error) {
      next(error);
    }
  };

  deleteHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      await this.horarioService.delete(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}
