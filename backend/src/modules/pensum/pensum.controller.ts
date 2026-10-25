import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { PensumService } from "./pensum.service.js";
import {
  createPensumSchema,
  addMateriaSchema,
  formatearErroresZod,
} from "./pensum.validation.js";

export class PensumController {
  constructor(private pensumService: PensumService) {}

  createHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).userId;
      const parsed = createPensumSchema.parse(req.body);
      const pensum = await this.pensumService.create(userId, parsed);
      res.status(201).json({ pensum });
    } catch (error) {
      if (error instanceof ZodError) {
        const errores = formatearErroresZod(error);
        res.status(400).json({ error: errores[0], errores });
        return;
      }
      next(error);
    }
  };

  listHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).userId;
      const pensums = await this.pensumService.list(userId);
      res.json({ pensums });
    } catch (error) {
      next(error);
    }
  };

  getByIdHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).userId;
      const id = req.params.id as string;
      const pensum = await this.pensumService.getById(id, userId);
      res.json({ pensum });
    } catch (error) {
      next(error);
    }
  };

  agregarMateriaHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).userId;
      const id = req.params.id as string;
      const parsed = addMateriaSchema.parse(req.body);
      const pensum = await this.pensumService.agregarMateria(id, userId, parsed);
      res.status(201).json({ pensum });
    } catch (error) {
      if (error instanceof ZodError) {
        const errores = formatearErroresZod(error);
        res.status(400).json({ error: errores[0], errores });
        return;
      }
      next(error);
    }
  };

  updateMateriaEstadoHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).userId;
      const id = req.params.id as string;
      const codigo = req.params.codigo as string;
      const { estado } = req.body;
      await this.pensumService.updateMateriaEstado(id, codigo, estado, userId);
      res.json({ message: "Estado actualizado" });
    } catch (error) {
      next(error);
    }
  };

  deleteHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).userId;
      const id = req.params.id as string;
      await this.pensumService.delete(id, userId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}
