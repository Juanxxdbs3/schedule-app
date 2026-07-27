import { describe, it, expect, vi, beforeEach } from "vitest";
import { HorarioService } from "../horario.service.js";
import type {
  Horario,
  Bloque,
  Pensum,
  Materia,
  EstadoMateria,
} from "../../../domain/entities/index.js";
import type { IHorarioRepository } from "../../../domain/interfaces/index.js";
import type { IPensumRepository } from "../../../domain/interfaces/index.js";
import type { ICreditLimitStrategy } from "../strategies/ICreditLimitStrategy.js";
import type { IConflictDetectionStrategy } from "../strategies/IConflictDetectionStrategy.js";
import { ValidationError } from "../../../shared/errors/AppError.js";

// ---------------------------------------------------------------------------
// Fake repositories (en memoria, sin MongoDB)
// ---------------------------------------------------------------------------

class FakeHorarioRepository implements IHorarioRepository {
  private store = new Map<string, Horario>();

  setHorario(horario: Horario): void {
    this.store.set(horario.id, horario);
  }

  async findById(id: string): Promise<Horario | null> {
    return this.store.get(id) ?? null;
  }

  async replaceBloques(horarioId: string, bloques: Bloque[]): Promise<void> {
    const h = this.store.get(horarioId);
    if (h) {
      this.store.set(horarioId, { ...h, bloques });
    }
  }

  async findByUserId(): Promise<Horario[]> {
    throw new Error("No utilizado en saveBloques");
  }
  async create(): Promise<Horario> {
    throw new Error("No utilizado en saveBloques");
  }
  async addBloque(): Promise<void> {
    throw new Error("No utilizado en saveBloques");
  }
  async removeBloque(): Promise<void> {
    throw new Error("No utilizado en saveBloques");
  }
  async finalizar(): Promise<void> {
    throw new Error("No utilizado en saveBloques");
  }
  async delete(): Promise<void> {
    throw new Error("No utilizado en saveBloques");
  }
}

class FakePensumRepository implements IPensumRepository {
  private store = new Map<string, Pensum>();
  readonly updateCalls: Array<{
    pensumId: string;
    codigo: string;
    estado: EstadoMateria;
  }> = [];

  setPensum(pensum: Pensum): void {
    this.store.set(pensum.id, pensum);
  }

  async findById(id: string): Promise<Pensum | null> {
    return this.store.get(id) ?? null;
  }

  async updateMateriaEstado(
    pensumId: string,
    materiaCodigo: string,
    nuevoEstado: EstadoMateria,
  ): Promise<void> {
    this.updateCalls.push({ pensumId, codigo: materiaCodigo, estado: nuevoEstado });

    // También actualizamos la copia en memoria para mantener consistencia
    const p = this.store.get(pensumId);
    if (p) {
      this.store.set(pensumId, {
        ...p,
        materias: p.materias.map((m) =>
          m.codigo === materiaCodigo ? { ...m, estado: nuevoEstado } : m,
        ),
      });
    }
  }

  async findAllByUserId(): Promise<Pensum[]> {
    throw new Error("No utilizado en saveBloques");
  }
  async create(): Promise<Pensum> {
    throw new Error("No utilizado en saveBloques");
  }
  async delete(): Promise<void> {
    throw new Error("No utilizado en saveBloques");
  }
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const PENSUM_ID = "pensum-test-1";
const HORARIO_ID = "horario-test-1";
const USER_ID = "user-test-1";

function makeMateria(codigo: string, creditos = 3): Materia {
  return {
    codigo,
    nombre: `Materia ${codigo}`,
    creditos,
    semestre: 1,
    requiere: [],
    estado: "activo",
  };
}

function makeBloque(
  materiaCodigo: string,
  dia: "lunes" | "martes" | "miercoles" = "lunes",
): Bloque {
  return {
    materiaCodigo,
    dia,
    horaInicio: "08:00",
    horaFin: "10:00",
  };
}

function makePensum(materias: Materia[]): Pensum {
  return {
    id: PENSUM_ID,
    userId: USER_ID,
    nombre: "Pensum de prueba",
    materias,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
  };
}

function makeHorario(bloques: Bloque[]): Horario {
  return {
    id: HORARIO_ID,
    userId: USER_ID,
    pensumId: PENSUM_ID,
    semestreLabel: "2025-1",
    maxCreditos: 20,
    unidadHoraMinutos: 60,
    estado: "en_progreso",
    bloques,
    createdAt: new Date("2025-01-01"),
    finalizadoAt: null,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("HorarioService.saveBloques", () => {
  let horarioRepo: FakeHorarioRepository;
  let pensumRepo: FakePensumRepository;
  let creditStrategy: ICreditLimitStrategy;
  let conflictStrategy: IConflictDetectionStrategy;
  let service: HorarioService;

  beforeEach(() => {
    horarioRepo = new FakeHorarioRepository();
    pensumRepo = new FakePensumRepository();

    // Estrategias que dejan pasar todo (validación OK)
    creditStrategy = { validar: () => true };
    conflictStrategy = { hayChoque: () => false };

    service = new HorarioService(
      horarioRepo,
      pensumRepo,
      creditStrategy,
      conflictStrategy,
    );
  });

  // ── Caso 1: quitar un bloque ───────────────────────────────────

  describe("remove bloque", () => {
    it("llama updateMateriaEstado con 'activo' cuando se elimina la única materia del horario", async () => {
      const materiaX = makeMateria("X");
      horarioRepo.setHorario(makeHorario([makeBloque("X")]));
      pensumRepo.setPensum(makePensum([materiaX]));

      await service.saveBloques(HORARIO_ID, []);

      expect(pensumRepo.updateCalls).toHaveLength(1);
      expect(pensumRepo.updateCalls[0]).toEqual({
        pensumId: PENSUM_ID,
        codigo: "X",
        estado: "activo",
      });
    });
  });

  // ── Caso 2: agregar un bloque ──────────────────────────────────

  describe("add bloque", () => {
    it("llama updateMateriaEstado con 'matriculado' cuando se agrega una materia nueva", async () => {
      const materiaY = makeMateria("Y");
      horarioRepo.setHorario(makeHorario([]));
      pensumRepo.setPensum(makePensum([materiaY]));

      await service.saveBloques(HORARIO_ID, [makeBloque("Y")]);

      expect(pensumRepo.updateCalls).toHaveLength(1);
      expect(pensumRepo.updateCalls[0]).toEqual({
        pensumId: PENSUM_ID,
        codigo: "Y",
        estado: "matriculado",
      });
    });
  });

  // ── Caso 3: sin cambios ────────────────────────────────────────

  describe("no change", () => {
    it("no llama updateMateriaEstado si los bloques nuevos tienen los mismos códigos que los viejos", async () => {
      const materiaX = makeMateria("X");
      horarioRepo.setHorario(makeHorario([makeBloque("X")]));
      pensumRepo.setPensum(makePensum([materiaX]));

      await service.saveBloques(HORARIO_ID, [makeBloque("X")]);

      expect(pensumRepo.updateCalls).toHaveLength(0);
    });
  });

  // ── Caso 4: agregar y quitar simultáneamente ───────────────────

  describe("add + remove simultaneously", () => {
    it("llama updateMateriaEstado para el código quitado ('activo') y para el agregado ('matriculado')", async () => {
      const materiaX = makeMateria("X");
      const materiaY = makeMateria("Y");
      horarioRepo.setHorario(makeHorario([makeBloque("X")]));
      pensumRepo.setPensum(makePensum([materiaX, materiaY]));

      await service.saveBloques(HORARIO_ID, [makeBloque("Y", "martes")]);

      expect(pensumRepo.updateCalls).toHaveLength(2);
      expect(pensumRepo.updateCalls).toContainEqual({
        pensumId: PENSUM_ID,
        codigo: "Y",
        estado: "matriculado",
      });
      expect(pensumRepo.updateCalls).toContainEqual({
        pensumId: PENSUM_ID,
        codigo: "X",
        estado: "activo",
      });
    });
  });

  // ── Caso 5: validaciones ───────────────────────────────────────

  describe("validation still works", () => {
    it("lanza ValidationError si 'bloques' no es un array", async () => {
      horarioRepo.setHorario(makeHorario([]));
      pensumRepo.setPensum(makePensum([]));

      await expect(
        service.saveBloques(HORARIO_ID, null as unknown as Bloque[]),
      ).rejects.toThrow(ValidationError);

      await expect(
        service.saveBloques(HORARIO_ID, "no-es-array" as unknown as Bloque[]),
      ).rejects.toThrow(ValidationError);
    });

    it("lanza ValidationError cuando el límite de créditos se excede y NO llama updateMateriaEstado", async () => {
      // Reemplazamos la estrategia de crédito para que falle
      service = new HorarioService(horarioRepo, pensumRepo, {
        validar: () => false,
      }, conflictStrategy);

      const materiaX = makeMateria("X");
      horarioRepo.setHorario(makeHorario([]));
      pensumRepo.setPensum(makePensum([materiaX]));

      await expect(
        service.saveBloques(HORARIO_ID, [makeBloque("X")]),
      ).rejects.toThrow(ValidationError);

      // La validación falló antes de tocar el repositorio
      expect(pensumRepo.updateCalls).toHaveLength(0);
    });

    it("lanza ValidationError cuando hay bloques superpuestos y NO llama updateMateriaEstado", async () => {
      // Reemplazamos la estrategia de conflicto para que detecte choque
      service = new HorarioService(horarioRepo, pensumRepo, creditStrategy, {
        hayChoque: () => true,
      });

      const materiaX = makeMateria("X");
      const materiaY = makeMateria("Y");
      horarioRepo.setHorario(makeHorario([]));
      pensumRepo.setPensum(makePensum([materiaX, materiaY]));

      await expect(
        service.saveBloques(HORARIO_ID, [makeBloque("X"), makeBloque("Y")]),
      ).rejects.toThrow(ValidationError);

      expect(pensumRepo.updateCalls).toHaveLength(0);
    });
  });
});
