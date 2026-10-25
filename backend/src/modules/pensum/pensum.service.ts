import { IPensumRepository } from "../../domain/interfaces/index.js";
import { Pensum, Materia, EstadoMateria } from "../../domain/entities/index.js";
import { NotFoundError, ValidationError } from "../../shared/errors/AppError.js";

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

  async agregarMateria(
    pensumId: string,
    userId: string,
    data: Omit<Materia, "estado"> & { estado?: EstadoMateria },
  ): Promise<Pensum> {
    const pensum = await this.getById(pensumId, userId);
    const materia: Materia = { ...data, estado: data.estado ?? "activo" };

    if (pensum.materias.some((m) => m.codigo === materia.codigo)) {
      throw new ValidationError(`Ya existe una materia con el código '${materia.codigo}' en este pensum`);
    }

    if (materia.requiere.includes(materia.codigo)) {
      throw new ValidationError(`La materia '${materia.codigo}' no puede requerirse a sí misma`);
    }

    const codigosExistentes = new Set(pensum.materias.map((m) => m.codigo));
    const faltantes = materia.requiere.filter((codigo) => !codigosExistentes.has(codigo));
    if (faltantes.length > 0) {
      throw new ValidationError(
        `'requiere' incluye códigos que no existen en este pensum: ${faltantes.join(", ")}`,
      );
    }

    return this.pensumRepo.addMateria(pensumId, materia);
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
