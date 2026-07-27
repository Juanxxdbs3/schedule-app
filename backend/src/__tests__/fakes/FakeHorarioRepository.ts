import type {
  Horario,
  Bloque,
  EstadoHorario,
} from "../../domain/entities/index.js";
import type { IHorarioRepository } from "../../domain/interfaces/index.js";

export class FakeHorarioRepository implements IHorarioRepository {
  private horarios = new Map<string, Horario>();
  private bloqueIdCounter = 0;
  private horarioIdCounter = 0;

  /** Retrieve all stored horarios (for assertions). */
  all(): Horario[] {
    return Array.from(this.horarios.values());
  }

  /** Directly seed a horario into the store. */
  setHorario(horario: Horario): void {
    this.horarios.set(horario.id, structuredClone(horario));
  }

  /** Remove all horarios and reset counters. Call in beforeEach. */
  reset(): void {
    this.horarios.clear();
    this.horarioIdCounter = 0;
    this.bloqueIdCounter = 0;
  }

  // ------------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------------

  /**
   * Assign sequential ids to any blocks that don't have one yet.
   * This mimics what the Mongo repository does when inserting.
   */
  private ensureBloqueIds(bloques: Bloque[]): Bloque[] {
    return bloques.map((b) => ({
      ...b,
      id: b.id ?? String(++this.bloqueIdCounter),
    }));
  }

  // ------------------------------------------------------------------
  // IHorarioRepository
  // ------------------------------------------------------------------

  async findByUserId(userId: string): Promise<Horario[]> {
    return Array.from(this.horarios.values())
      .filter((h) => h.userId === userId)
      .map((h) => structuredClone(h));
  }

  async findById(id: string): Promise<Horario | null> {
    const found = this.horarios.get(id);
    return found ? structuredClone(found) : null;
  }

  async create(data: {
    userId: string;
    pensumId: string;
    semestreLabel: string;
    maxCreditos: number;
    unidadHoraMinutos: number;
  }): Promise<Horario> {
    const id = String(++this.horarioIdCounter);
    const now = new Date();
    const horario: Horario = {
      id,
      userId: data.userId,
      pensumId: data.pensumId,
      semestreLabel: data.semestreLabel,
      maxCreditos: data.maxCreditos,
      unidadHoraMinutos: data.unidadHoraMinutos,
      estado: "en_progreso" as EstadoHorario,
      bloques: [],
      createdAt: now,
      finalizadoAt: null,
    };
    this.horarios.set(id, horario);
    return structuredClone(horario);
  }

  async addBloque(horarioId: string, bloque: Bloque): Promise<void> {
    const h = this.horarios.get(horarioId);
    if (!h) return;

    const [bloqueWithId] = this.ensureBloqueIds([bloque]);
    this.horarios.set(horarioId, {
      ...h,
      bloques: [...h.bloques, bloqueWithId],
    });
  }

  async removeBloqueById(
    horarioId: string,
    bloqueId: string,
  ): Promise<void> {
    const h = this.horarios.get(horarioId);
    if (!h) return;

    this.horarios.set(horarioId, {
      ...h,
      bloques: h.bloques.filter((b) => b.id !== bloqueId),
    });
  }

  async replaceBloques(
    horarioId: string,
    bloques: Bloque[],
  ): Promise<void> {
    const h = this.horarios.get(horarioId);
    if (!h) return;

    const bloquesWithIds = this.ensureBloqueIds(bloques);
    this.horarios.set(horarioId, { ...h, bloques: bloquesWithIds });
  }

  async finalizar(
    horarioId: string,
    finalizadoAt: Date,
  ): Promise<void> {
    const h = this.horarios.get(horarioId);
    if (!h) return;

    this.horarios.set(horarioId, {
      ...h,
      estado: "finalizado" as EstadoHorario,
      finalizadoAt,
    });
  }

  async delete(id: string): Promise<void> {
    this.horarios.delete(id);
  }
}
