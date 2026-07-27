import type {
  Pensum,
  Materia,
  EstadoMateria,
} from "../../domain/entities/index.js";
import type { IPensumRepository } from "../../domain/interfaces/index.js";

export class FakePensumRepository implements IPensumRepository {
  private pensums = new Map<string, Pensum>();
  private idCounter = 0;

  /** Track every call to updateMateriaEstado for later assertions. */
  readonly updateCalls: Array<{
    pensumId: string;
    codigo: string;
    estado: EstadoMateria;
  }> = [];

  /** Retrieve all stored pensums (for assertions). */
  all(): Pensum[] {
    return Array.from(this.pensums.values());
  }

  /** Directly seed a pensum into the store. */
  setPensum(pensum: Pensum): void {
    this.pensums.set(pensum.id, structuredClone(pensum));
  }

  /** Remove all pensums and reset call log. Call in beforeEach. */
  reset(): void {
    this.pensums.clear();
    this.updateCalls.length = 0;
    this.idCounter = 0;
  }

  // ------------------------------------------------------------------
  // IPensumRepository
  // ------------------------------------------------------------------

  async findAllByUserId(userId: string): Promise<Pensum[]> {
    return Array.from(this.pensums.values()).filter(
      (p) => p.userId === userId,
    );
  }

  async findById(id: string): Promise<Pensum | null> {
    const found = this.pensums.get(id);
    return found ? structuredClone(found) : null;
  }

  async create(data: {
    userId: string;
    nombre: string;
    materias: Materia[];
  }): Promise<Pensum> {
    const id = String(++this.idCounter);
    const now = new Date();
    const pensum: Pensum = {
      id,
      userId: data.userId,
      nombre: data.nombre,
      materias: structuredClone(data.materias),
      createdAt: now,
      updatedAt: now,
    };
    this.pensums.set(id, pensum);
    return structuredClone(pensum);
  }

  async updateMateriaEstado(
    pensumId: string,
    materiaCodigo: string,
    nuevoEstado: EstadoMateria,
  ): Promise<void> {
    this.updateCalls.push({
      pensumId,
      codigo: materiaCodigo,
      estado: nuevoEstado,
    });

    const p = this.pensums.get(pensumId);
    if (p) {
      this.pensums.set(pensumId, {
        ...p,
        materias: p.materias.map((m) =>
          m.codigo === materiaCodigo ? { ...m, estado: nuevoEstado } : m,
        ),
        updatedAt: new Date(),
      });
    }
  }

  async delete(id: string): Promise<void> {
    this.pensums.delete(id);
  }
}
