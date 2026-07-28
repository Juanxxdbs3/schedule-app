import { describe, it, expect, beforeEach } from "vitest";
import { HorarioService } from "../horario.service.js";
import { FakeHorarioRepository } from "../../../__tests__/fakes/FakeHorarioRepository.js";
import { FakePensumRepository } from "../../../__tests__/fakes/FakePensumRepository.js";
import { SimpleCreditLimitStrategy } from "../strategies/impl/SimpleCreditLimitStrategy.js";
import { SimpleConflictDetectionStrategy } from "../strategies/impl/SimpleConflictDetectionStrategy.js";
import { NotFoundError, ValidationError } from "../../../shared/errors/AppError.js";
import type { Horario, Bloque, Materia, Pensum, DiaSemana } from "../../../domain/entities/index.js";

const USER_ID = "user-1";
const PENSUM_ID = "pensum-1";

function makeMateria(codigo: string, creditos = 3): Materia {
  return { codigo, nombre: `Materia ${codigo}`, creditos, semestre: 1, requiere: [], estado: "activo" };
}

function makeBloque(materiaCodigo: string, dia: DiaSemana = "lunes", horaInicio = "07:00", horaFin = "08:40"): Bloque {
  return { materiaCodigo, dia, horaInicio, horaFin };
}

function makePensum(materias: Materia[]): Pensum {
  return { id: PENSUM_ID, userId: USER_ID, nombre: "Test Pensum", materias, createdAt: new Date(), updatedAt: new Date() };
}

describe("HorarioService", () => {
  let service: HorarioService;
  let horarioRepo: FakeHorarioRepository;
  let pensumRepo: FakePensumRepository;

  beforeEach(() => {
    horarioRepo = new FakeHorarioRepository();
    pensumRepo = new FakePensumRepository();
    service = new HorarioService(
      horarioRepo,
      pensumRepo,
      new SimpleCreditLimitStrategy(),
      new SimpleConflictDetectionStrategy(),
    );
  });

  describe("create", () => {
    it("crea un horario si el pensum existe y pertenece al usuario", async () => {
      pensumRepo.setPensum(makePensum([makeMateria("M1")]));

      const horario = await service.create(USER_ID, PENSUM_ID, "2026-1", 18, 50);

      expect(horario.semestreLabel).toBe("2026-1");
      expect(horario.maxCreditos).toBe(18);
      expect(horario.unidadHoraMinutos).toBe(50);
      expect(horario.estado).toBe("en_progreso");
    });

    it("lanza NotFoundError si el pensum no pertenece al usuario", async () => {
      pensumRepo.setPensum({ ...makePensum([makeMateria("M1")]), userId: "other-user" });

      await expect(service.create(USER_ID, PENSUM_ID, "2026-1", 18, 50)).rejects.toThrow(NotFoundError);
    });

    it("lanza NotFoundError si el pensum no existe", async () => {
      await expect(service.create(USER_ID, "no-existe", "2026-1", 18, 50)).rejects.toThrow(NotFoundError);
    });
  });

  describe("list", () => {
    it("retorna horarios del usuario filtrados por pensumId y estado", async () => {
      pensumRepo.setPensum(makePensum([makeMateria("M1")]));
      const h1 = await service.create(USER_ID, PENSUM_ID, "2026-1", 18, 50);
      const h2 = await service.create(USER_ID, PENSUM_ID, "2026-2", 18, 50);

      const list = await service.list(USER_ID, { pensumId: PENSUM_ID });
      expect(list).toHaveLength(2);

      const filtered = await service.list(USER_ID, { estado: "en_progreso" });
      expect(filtered).toHaveLength(2);

      const noMatch = await service.list(USER_ID, { estado: "finalizado" });
      expect(noMatch).toHaveLength(0);
    });
  });

  describe("getById", () => {
    it("retorna el horario si existe y pertenece al usuario", async () => {
      pensumRepo.setPensum(makePensum([makeMateria("M1")]));
      const created = await service.create(USER_ID, PENSUM_ID, "2026-1", 18, 50);

      const found = await service.getById(created.id, USER_ID);
      expect(found.id).toBe(created.id);
    });

    it("lanza NotFoundError si no existe", async () => {
      await expect(service.getById("no-existe", USER_ID)).rejects.toThrow(NotFoundError);
    });

    it("lanza NotFoundError si no pertenece al usuario", async () => {
      pensumRepo.setPensum(makePensum([makeMateria("M1")]));
      const created = await service.create(USER_ID, PENSUM_ID, "2026-1", 18, 50);

      await expect(service.getById(created.id, "other-user")).rejects.toThrow(NotFoundError);
    });
  });

  describe("addBloque", () => {
    it("agrega un bloque y marca materia como matriculada", async () => {
      pensumRepo.setPensum(makePensum([makeMateria("M1")]));
      const horario = await service.create(USER_ID, PENSUM_ID, "2026-1", 18, 50);

      await service.addBloque(horario.id, makeBloque("M1"), USER_ID);

      const updated = await horarioRepo.findById(horario.id);
      expect(updated!.bloques).toHaveLength(1);
      expect(pensumRepo.updateCalls).toContainEqual({ pensumId: PENSUM_ID, codigo: "M1", estado: "matriculado" });
    });

    it("lanza ValidationError si hay choque de horario", async () => {
      pensumRepo.setPensum(makePensum([makeMateria("M1"), makeMateria("M2")]));
      const horario = await service.create(USER_ID, PENSUM_ID, "2026-1", 18, 50);
      await service.addBloque(horario.id, makeBloque("M1", "lunes", "07:00", "08:40"), USER_ID);

      await expect(
        service.addBloque(horario.id, makeBloque("M2", "lunes", "07:50", "09:30"), USER_ID),
      ).rejects.toThrow(ValidationError);
    });

    it("lanza ValidationError si excede límite de créditos", async () => {
      pensumRepo.setPensum(makePensum([makeMateria("M1", 10), makeMateria("M2", 10)]));
      const horario = await service.create(USER_ID, PENSUM_ID, "2026-1", 15, 50);
      await service.addBloque(horario.id, makeBloque("M1", "lunes", "07:00", "08:40"), USER_ID);

      await expect(
        service.addBloque(horario.id, makeBloque("M2", "martes", "07:00", "08:40"), USER_ID),
      ).rejects.toThrow(ValidationError);
    });
  });

  describe("removeBloque", () => {
    it("elimina un bloque y marca materia como activa", async () => {
      pensumRepo.setPensum(makePensum([makeMateria("M1")]));
      const horario = await service.create(USER_ID, PENSUM_ID, "2026-1", 18, 50);
      await service.addBloque(horario.id, makeBloque("M1"), USER_ID);

      const withBloque = await horarioRepo.findById(horario.id);
      const bloqueId = withBloque!.bloques[0].id!;

      await service.removeBloque(horario.id, bloqueId, USER_ID);

      const updated = await horarioRepo.findById(horario.id);
      expect(updated!.bloques).toHaveLength(0);
      expect(pensumRepo.updateCalls).toContainEqual({ pensumId: PENSUM_ID, codigo: "M1", estado: "activo" });
    });

    it("lanza NotFoundError si el bloque no existe", async () => {
      pensumRepo.setPensum(makePensum([makeMateria("M1")]));
      const horario = await service.create(USER_ID, PENSUM_ID, "2026-1", 18, 50);

      await expect(service.removeBloque(horario.id, "no-existe", USER_ID)).rejects.toThrow(NotFoundError);
    });
  });

  describe("marcarResultado", () => {
    it("marca materia como cursada cuando aprueba", async () => {
      pensumRepo.setPensum(makePensum([makeMateria("M1")]));
      const horario = await service.create(USER_ID, PENSUM_ID, "2026-1", 18, 50);

      await service.marcarResultado(horario.id, "M1", "aprobada", USER_ID);

      expect(pensumRepo.updateCalls).toContainEqual({ pensumId: PENSUM_ID, codigo: "M1", estado: "cursado" });
      const updated = await horarioRepo.findById(horario.id);
      expect(updated!.resultados["M1"]).toBe("aprobada");
    });

    it("marca materia como activa cuando pierde", async () => {
      pensumRepo.setPensum(makePensum([makeMateria("M1")]));
      const horario = await service.create(USER_ID, PENSUM_ID, "2026-1", 18, 50);

      await service.marcarResultado(horario.id, "M1", "perdida", USER_ID);

      expect(pensumRepo.updateCalls).toContainEqual({ pensumId: PENSUM_ID, codigo: "M1", estado: "activo" });
      const updated = await horarioRepo.findById(horario.id);
      expect(updated!.resultados["M1"]).toBe("perdida");
    });

    it("deshace resultado: null quita key de resultados y pone materia en matriculado", async () => {
      pensumRepo.setPensum(makePensum([makeMateria("M1")]));
      const horario = await service.create(USER_ID, PENSUM_ID, "2026-1", 18, 50);
      await service.marcarResultado(horario.id, "M1", "aprobada", USER_ID);

      await service.marcarResultado(horario.id, "M1", null, USER_ID);

      expect(pensumRepo.updateCalls).toContainEqual({ pensumId: PENSUM_ID, codigo: "M1", estado: "matriculado" });
      const updated = await horarioRepo.findById(horario.id);
      expect(updated!.resultados["M1"]).toBeUndefined();
    });

    it("desbloquea materias en_espera cuyos prerrequisitos se cumplen al aprobar", async () => {
      const prerreq = makeMateria("PRE", 3);
      const bloqueada: Materia = { codigo: "BLOQ", nombre: "Bloqueada", creditos: 3, semestre: 2, requiere: ["PRE"], estado: "en_espera" };
      const materias = [prerreq, bloqueada];
      pensumRepo.setPensum(makePensum(materias));
      const horario = await service.create(USER_ID, PENSUM_ID, "2026-1", 18, 50);

      await service.marcarResultado(horario.id, "PRE", "aprobada", USER_ID);

      expect(pensumRepo.updateCalls).toContainEqual({ pensumId: PENSUM_ID, codigo: "PRE", estado: "cursado" });
      expect(pensumRepo.updateCalls).toContainEqual({ pensumId: PENSUM_ID, codigo: "BLOQ", estado: "activo" });
    });

    it("reversa en cascada: al deshacer una cursada, dependientes vuelven a en_espera", async () => {
      const A = makeMateria("A", 3);
      const B: Materia = { codigo: "B", nombre: "B", creditos: 3, semestre: 2, requiere: ["A"], estado: "activo" };
      pensumRepo.setPensum(makePensum([A, B]));
      const horario = await service.create(USER_ID, PENSUM_ID, "2026-1", 18, 50);

      // Aprobamos A → B debería pasar a activo (ya está activo, pero no hay matricula que bloquee)
      await service.marcarResultado(horario.id, "A", "aprobada", USER_ID);
      expect(pensumRepo.updateCalls).toContainEqual({ pensumId: PENSUM_ID, codigo: "A", estado: "cursado" });

      // Forzar B a activo (simula que se desbloqueó)
      const p = await pensumRepo.findById(PENSUM_ID);
      if (p) {
        await pensumRepo.updateMateriaEstado(PENSUM_ID, "B", "activo");
      }

      // Deshacemos A
      await service.marcarResultado(horario.id, "A", null, USER_ID);

      expect(pensumRepo.updateCalls).toContainEqual({ pensumId: PENSUM_ID, codigo: "B", estado: "en_espera" });
    });

    it("reversa en cascada: al marcar perdida una cursada, dependientes vuelven a en_espera", async () => {
      const A = makeMateria("A", 3);
      const B: Materia = { codigo: "B", nombre: "B", creditos: 3, semestre: 2, requiere: ["A"], estado: "activo" };
      pensumRepo.setPensum(makePensum([A, B]));
      const horario = await service.create(USER_ID, PENSUM_ID, "2026-1", 18, 50);

      await service.marcarResultado(horario.id, "A", "aprobada", USER_ID);
      const p = await pensumRepo.findById(PENSUM_ID);
      if (p) {
        await pensumRepo.updateMateriaEstado(PENSUM_ID, "B", "activo");
      }

      await service.marcarResultado(horario.id, "A", "perdida", USER_ID);

      expect(pensumRepo.updateCalls).toContainEqual({ pensumId: PENSUM_ID, codigo: "B", estado: "en_espera" });
    });
  });

  describe("finalizar", () => {
    it("marca el horario como finalizado", async () => {
      pensumRepo.setPensum(makePensum([makeMateria("M1")]));
      const horario = await service.create(USER_ID, PENSUM_ID, "2026-1", 18, 50);
      await service.marcarResultado(horario.id, "M1", "aprobada", USER_ID);

      await service.finalizar(horario.id, USER_ID);

      const updated = await horarioRepo.findById(horario.id);
      expect(updated!.estado).toBe("finalizado");
      expect(updated!.finalizadoAt).toBeInstanceOf(Date);
    });

    it("lanza NotFoundError si el horario no existe", async () => {
      await expect(service.finalizar("no-existe", USER_ID)).rejects.toThrow(NotFoundError);
    });

    it("rechaza si no todas las materias tienen resultado", async () => {
      pensumRepo.setPensum(makePensum([makeMateria("M1"), makeMateria("M2")]));
      const horario = await service.create(USER_ID, PENSUM_ID, "2026-1", 18, 50);
      await service.addBloque(horario.id, makeBloque("M1", "lunes", "07:00", "08:40"), USER_ID);
      await service.addBloque(horario.id, makeBloque("M2", "martes", "07:00", "08:40"), USER_ID);
      await service.marcarResultado(horario.id, "M1", "aprobada", USER_ID);

      await expect(service.finalizar(horario.id, USER_ID)).rejects.toThrow(ValidationError);
    });
  });

  describe("validar cursado en saveBloques", () => {
    it("rechaza saveBloques si un quitado está en cursado", async () => {
      pensumRepo.setPensum(makePensum([makeMateria("M1", 3)]));
      const horario = await service.create(USER_ID, PENSUM_ID, "2026-1", 18, 50);
      await service.addBloque(horario.id, makeBloque("M1", "lunes", "07:00", "08:40"), USER_ID);
      await service.marcarResultado(horario.id, "M1", "aprobada", USER_ID);

      await expect(service.saveBloques(horario.id, [], USER_ID)).rejects.toThrow(ValidationError);
    });
  });

  describe("validar cursado en removeBloque", () => {
    it("rechaza removeBloque si la materia está cursada", async () => {
      pensumRepo.setPensum(makePensum([makeMateria("M1", 3)]));
      const horario = await service.create(USER_ID, PENSUM_ID, "2026-1", 18, 50);
      await service.addBloque(horario.id, makeBloque("M1", "lunes", "07:00", "08:40"), USER_ID);
      await service.marcarResultado(horario.id, "M1", "aprobada", USER_ID);

      const bloqueId = (await horarioRepo.findById(horario.id))!.bloques[0].id!;
      await expect(service.removeBloque(horario.id, bloqueId, USER_ID)).rejects.toThrow(ValidationError);
    });
  });

  describe("validar cursado en delete", () => {
    it("rechaza delete si un bloque está cursado", async () => {
      pensumRepo.setPensum(makePensum([makeMateria("M1", 3)]));
      const horario = await service.create(USER_ID, PENSUM_ID, "2026-1", 18, 50);
      await service.addBloque(horario.id, makeBloque("M1", "lunes", "07:00", "08:40"), USER_ID);
      await service.marcarResultado(horario.id, "M1", "aprobada", USER_ID);

      await expect(service.delete(horario.id, USER_ID)).rejects.toThrow(ValidationError);
    });

    it("elimina horario finalizado sin revertir materias", async () => {
      pensumRepo.setPensum(makePensum([makeMateria("M1")]));
      const horario = await service.create(USER_ID, PENSUM_ID, "2026-1", 18, 50);
      horarioRepo.setHorario({ ...horario, estado: "finalizado", finalizadoAt: new Date() });

      await service.delete(horario.id, USER_ID);

      const deleted = await horarioRepo.findById(horario.id);
      expect(deleted).toBeNull();
      expect(pensumRepo.updateCalls).toHaveLength(0);
    });
  });
});
