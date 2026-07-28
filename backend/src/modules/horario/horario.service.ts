import { IHorarioRepository, IPensumRepository } from "../../domain/interfaces/index.js";
import { Horario, Bloque, EstadoMateria } from "../../domain/entities/index.js";
import { ICreditLimitStrategy } from "./strategies/ICreditLimitStrategy.js";
import { IConflictDetectionStrategy } from "./strategies/IConflictDetectionStrategy.js";
import { NotFoundError, ValidationError } from "../../shared/errors/AppError.js";

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
    if (!pensum || pensum.userId !== userId) {
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

  async getById(id: string, userId: string): Promise<Horario> {
    const horario = await this.horarioRepo.findById(id);
    if (!horario || horario.userId !== userId) {
      throw new NotFoundError("Horario not found");
    }
    return horario;
  }

  async addBloque(horarioId: string, bloque: Bloque, userId: string): Promise<void> {
    const horario = await this.getById(horarioId, userId);
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

  async saveBloques(horarioId: string, bloques: Bloque[], userId: string): Promise<void> {
    if (!Array.isArray(bloques)) {
      throw new ValidationError("'bloques' debe ser un array");
    }
    const horario = await this.getById(horarioId, userId);
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

    // Validar que ningún quitado esté en estado 'cursado'
    for (const codigo of quitados) {
      const materia = pensum.materias.find((m) => m.codigo === codigo);
      if (materia?.estado === "cursado") {
        throw new ValidationError(
          `No puedes quitar '${codigo}' porque ya está cursada. Deshaz su resultado primero.`,
        );
      }
    }

    await this.horarioRepo.replaceBloques(horarioId, bloques);

    for (const codigo of agregados) {
      await this.pensumRepo.updateMateriaEstado(horario.pensumId, codigo, "matriculado");
    }
    for (const codigo of quitados) {
      await this.pensumRepo.updateMateriaEstado(horario.pensumId, codigo, "activo");
    }
  }

  async removeBloque(horarioId: string, bloqueId: string, userId: string): Promise<void> {
    const horario = await this.getById(horarioId, userId);
    const bloque = horario.bloques.find((b) => b.id === bloqueId);
    if (!bloque) throw new NotFoundError("Bloque not found");

    const pensum = await this.pensumRepo.findById(horario.pensumId);
    const materia = pensum?.materias.find((m) => m.codigo === bloque.materiaCodigo);
    if (materia?.estado === "cursado") {
      throw new ValidationError(
        `No puedes quitar '${bloque.materiaCodigo}' porque ya está cursada. Deshaz su resultado primero.`,
      );
    }

    await this.horarioRepo.removeBloqueById(horarioId, bloqueId);
    await this.pensumRepo.updateMateriaEstado(horario.pensumId, bloque.materiaCodigo, "activo");
  }

  async marcarResultado(
    horarioId: string,
    materiaCodigo: string,
    resultado: 'aprobada' | 'perdida' | null,
    userId: string,
  ): Promise<void> {
    const horario = await this.getById(horarioId, userId);
    const pensum = await this.pensumRepo.findById(horario.pensumId);
    if (!pensum) throw new NotFoundError("Pensum not found for this horario");

    const materiaActual = pensum.materias.find((m) => m.codigo === materiaCodigo);
    const estabaCursado = materiaActual?.estado === "cursado";

    if (resultado === 'aprobada') {
      await this.pensumRepo.updateMateriaEstado(horario.pensumId, materiaCodigo, "cursado");
      await this.horarioRepo.setResultado(horarioId, materiaCodigo, 'aprobada');

      // Desbloquear materias en_espera cuyos prerrequisitos ya se cumplen
      const codigosCursados = new Set(
        pensum.materias
          .filter((m) => m.codigo === materiaCodigo || m.estado === "cursado")
          .map((m) => m.codigo),
      );
      const toUnlock = pensum.materias.filter(
        (m) => m.estado === "en_espera" && m.requiere.length > 0 && m.requiere.every((r) => codigosCursados.has(r)),
      );
      for (const m of toUnlock) {
        await this.pensumRepo.updateMateriaEstado(horario.pensumId, m.codigo, "activo");
      }
    } else if (resultado === 'perdida') {
      await this.pensumRepo.updateMateriaEstado(horario.pensumId, materiaCodigo, "activo");
      await this.horarioRepo.setResultado(horarioId, materiaCodigo, 'perdida');

      if (estabaCursado) {
        await this._reversaCascada(horario.pensumId, materiaCodigo);
      }
    } else {
      // null = deshacer
      await this.pensumRepo.updateMateriaEstado(horario.pensumId, materiaCodigo, "matriculado");
      await this.horarioRepo.setResultado(horarioId, materiaCodigo, null);

      if (estabaCursado) {
        await this._reversaCascada(horario.pensumId, materiaCodigo);
      }
    }
  }

  private async _reversaCascada(pensumId: string, codigoMateria: string): Promise<void> {
    const pensum = await this.pensumRepo.findById(pensumId);
    if (!pensum) return;

    const dependientes = pensum.materias.filter(
      (m) => m.requiere.includes(codigoMateria) && m.estado === "activo",
    );
    for (const m of dependientes) {
      await this.pensumRepo.updateMateriaEstado(pensumId, m.codigo, "en_espera");
    }
  }

  async finalizar(horarioId: string, userId: string): Promise<void> {
    const horario = await this.getById(horarioId, userId);

    const codigosUnicos = [...new Set(horario.bloques.map((b) => b.materiaCodigo))];
    const pendientes = codigosUnicos.filter((c) => !horario.resultados[c]);
    if (pendientes.length > 0) {
      throw new ValidationError(
        `Todas las materias deben tener un resultado antes de finalizar. Pendientes: ${pendientes.join(", ")}`,
      );
    }

    await this.horarioRepo.finalizar(horarioId, new Date());
  }

  async delete(horarioId: string, userId: string): Promise<void> {
    const horario = await this.getById(horarioId, userId);

    if (horario.estado === "en_progreso") {
      const pensum = await this.pensumRepo.findById(horario.pensumId);
      for (const bloque of horario.bloques) {
        const materia = pensum?.materias.find((m) => m.codigo === bloque.materiaCodigo);
        if (materia?.estado === "cursado") {
          throw new ValidationError(
            `No puedes eliminar este horario porque '${bloque.materiaCodigo}' ya está cursada. Deshaz su resultado primero.`,
          );
        }
      }
      for (const bloque of horario.bloques) {
        await this.pensumRepo.updateMateriaEstado(horario.pensumId, bloque.materiaCodigo, "activo");
      }
    }
    await this.horarioRepo.delete(horarioId);
  }
}
