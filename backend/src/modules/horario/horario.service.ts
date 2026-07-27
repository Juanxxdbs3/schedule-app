import { IHorarioRepository, IPensumRepository } from "../../domain/interfaces/index.js";
import { Horario, Bloque, EstadoMateria } from "../../domain/entities/index.js";
import { ICreditLimitStrategy } from "./strategies/ICreditLimitStrategy.js";
import { IConflictDetectionStrategy } from "./strategies/IConflictDetectionStrategy.js";
import { NotFoundError, ValidationError } from "../../shared/errors/AppError.js";

interface ResultadoMateria {
  materiaCodigo: string;
  aprobada: boolean;
}

export class HorarioService {
  constructor(
    private horarioRepo: IHorarioRepository,
    private pensumRepo: IPensumRepository,
    private creditLimitStrategy: ICreditLimitStrategy,
    private conflictStrategy: IConflictDetectionStrategy,
  ) {}

  async create(
    userId: string,
    pensumId: string,
    semestreLabel: string,
    maxCreditos: number,
    unidadHoraMinutos: number,
  ): Promise<Horario> {
    const pensum = await this.pensumRepo.findById(pensumId);
    if (!pensum) {
      throw new NotFoundError("Pensum not found");
    }

    return this.horarioRepo.create({
      userId,
      pensumId,
      semestreLabel,
      maxCreditos,
      unidadHoraMinutos,
    });
  }

  async list(userId: string, filtros?: { pensumId?: string; estado?: string }): Promise<Horario[]> {
    const horarios = await this.horarioRepo.findByUserId(userId);

    return horarios.filter((h) => {
      if (filtros?.pensumId && h.pensumId !== filtros.pensumId) return false;
      if (filtros?.estado && h.estado !== filtros.estado) return false;
      return true;
    });
  }

  async getById(id: string): Promise<Horario> {
    const horario = await this.horarioRepo.findById(id);
    if (!horario) {
      throw new NotFoundError("Horario not found");
    }
    return horario;
  }

  async addBloque(horarioId: string, bloque: Bloque): Promise<void> {
    const horario = await this.getById(horarioId);
    const pensum = await this.pensumRepo.findById(horario.pensumId);
    if (!pensum) {
      throw new NotFoundError("Pensum not found for this horario");
    }

    if (this.conflictStrategy.hayChoque(bloque, horario.bloques)) {
      throw new ValidationError("El bloque se superpone con un bloque existente");
    }

    const nuevosBloques = [...horario.bloques, bloque];
    if (!this.creditLimitStrategy.validar(nuevosBloques, pensum.materias, horario.maxCreditos)) {
      throw new ValidationError("El límite de créditos se excedería al agregar este bloque");
    }

    await this.horarioRepo.addBloque(horarioId, bloque);
    await this.pensumRepo.updateMateriaEstado(horario.pensumId, bloque.materiaCodigo, "matriculado");
  }

  async saveBloques(horarioId: string, bloques: Bloque[]): Promise<void> {
    if (!Array.isArray(bloques)) {
      throw new ValidationError("'bloques' debe ser un array");
    }
    const horario = await this.getById(horarioId);
    const pensum = await this.pensumRepo.findById(horario.pensumId);
    if (!pensum) {
      throw new NotFoundError("Pensum not found for this horario");
    }

    if (!this.creditLimitStrategy.validar(bloques, pensum.materias, horario.maxCreditos)) {
      throw new ValidationError("El límite de créditos se excedería con estos bloques");
    }

    const conflicted = bloques.some((bloque, index) => {
      const otros = bloques.filter((_, i) => i !== index);
      return this.conflictStrategy.hayChoque(bloque, otros);
    });
    if (conflicted) {
      throw new ValidationError("Uno o más bloques se superponen entre sí");
    }

    // Diff contra estado anterior en BD
    const codigosViejos = new Set(horario.bloques.map((b) => b.materiaCodigo));
    const codigosNuevos = new Set(bloques.map((b) => b.materiaCodigo));
    const agregados = [...codigosNuevos].filter((c) => !codigosViejos.has(c));
    const quitados = [...codigosViejos].filter((c) => !codigosNuevos.has(c));

    await this.horarioRepo.replaceBloques(horarioId, bloques);

    for (const codigo of agregados) {
      await this.pensumRepo.updateMateriaEstado(horario.pensumId, codigo, "matriculado");
    }
    for (const codigo of quitados) {
      await this.pensumRepo.updateMateriaEstado(horario.pensumId, codigo, "activo");
    }
  }

  async removeBloque(horarioId: string, materiaCodigo: string): Promise<void> {
    const horario = await this.getById(horarioId);
    await this.horarioRepo.removeBloque(horarioId, materiaCodigo);
    await this.pensumRepo.updateMateriaEstado(horario.pensumId, materiaCodigo, "activo");
  }

  async marcarResultado(horarioId: string, materiaCodigo: string, aprobada: boolean): Promise<void> {
    const horario = await this.getById(horarioId);
    const nuevoEstado: EstadoMateria = aprobada ? "cursado" : "activo";
    await this.pensumRepo.updateMateriaEstado(horario.pensumId, materiaCodigo, nuevoEstado);
  }

  async finalizar(horarioId: string): Promise<void> {
    await this.getById(horarioId);
    await this.horarioRepo.finalizar(horarioId, new Date());
  }

  async delete(id: string): Promise<void> {
    const horario = await this.getById(id);
    console.log(`[HorarioService.delete] Eliminando horario ${id} (${horario.bloques.length} bloques)`);
    await this.horarioRepo.delete(id);
  }
}
