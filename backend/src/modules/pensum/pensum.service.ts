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

  async getById(id: string): Promise<Pensum> {
    const pensum = await this.pensumRepo.findById(id);
    if (!pensum) {
      throw new NotFoundError("Pensum not found");
    }
    return pensum;
  }

  async updateMateriaEstado(
    pensumId: string,
    materiaCodigo: string,
    nuevoEstado: EstadoMateria,
  ): Promise<void> {
    // Ensure the pensum exists before updating
    await this.getById(pensumId);
    await this.pensumRepo.updateMateriaEstado(pensumId, materiaCodigo, nuevoEstado);
  }

  async delete(id: string): Promise<void> {
    await this.pensumRepo.delete(id);
  }
}
