import { IPensumRepository } from "../../domain/interfaces/index.js";
import { Pensum, Materia, EstadoMateria } from "../../domain/entities/index.js";
import { NotFoundError } from "../../shared/errors/AppError.js";

export class PensumService {
  constructor(private pensumRepo: IPensumRepository) {}

  async create(userId: string, data: { nombre: string; materias: Materia[] }): Promise<Pensum> {
    return this.pensumRepo.create({ userId, ...data });
  }

  async list(userId: string): Promise<Pensum[]> {
    return this.pensumRepo.findAllByUserId(userId);
  }

  async getById(id: string, userId: string): Promise<Pensum> {
    const pensum = await this.pensumRepo.findById(id);
    if (!pensum || pensum.userId !== userId) {
      throw new NotFoundError("Pensum not found");
    }
    return pensum;
  }

  async updateMateriaEstado(
    pensumId: string,
    materiaCodigo: string,
    nuevoEstado: EstadoMateria,
    userId: string,
  ): Promise<void> {
    await this.getById(pensumId, userId);
    await this.pensumRepo.updateMateriaEstado(pensumId, materiaCodigo, nuevoEstado);
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.getById(id, userId);
    await this.pensumRepo.delete(id);
  }
}
