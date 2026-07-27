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

      await service.marcarResultado(horario.id, "M1", true, USER_ID);

      expect(pensumRepo.updateCalls).toContainEqual({ pensumId: PENSUM_ID, codigo: "M1", estado: "cursado" });
    });

    it("marca materia como activa cuando pierde", async () => {
      pensumRepo.setPensum(makePensum([makeMateria("M1")]));
      const horario = await service.create(USER_ID, PENSUM_ID, "2026-1", 18, 50);

      await service.marcarResultado(horario.id, "M1", false, USER_ID);

      expect(pensumRepo.updateCalls).toContainEqual({ pensumId: PENSUM_ID, codigo: "M1", estado: "activo" });
    });

    it("desbloquea materias en_espera cuyos prerrequisitos se cumplen al aprobar", async () => {
      const prerreq = makeMateria("PRE", 3);
      const bloqueada: Materia = { codigo: "BLOQ", nombre: "Bloqueada", creditos: 3, semestre: 2, requiere: ["PRE"], estado: "en_espera" };
      // PRE ya está cursada
      const materias = [prerreq, bloqueada].map((m) =>
        m.codigo === "PRE" ? { ...m, estado: "cursado" as const } : m,
      );
      pensumRepo.setPensum(makePensum(materias));
      const horario = await service.create(USER_ID, PENSUM_ID, "2026-1", 18, 50);

      // Al aprobar cualquier materia, se revisan los prerrequisitos
      await service.marcarResultado(horario.id, "PRE", true, USER_ID);

      // PRE ya estaba cursada, pero la verificación de unlock corre y debería activar BLOQ
      expect(pensumRepo.updateCalls).toContainEqual({ pensumId: PENSUM_ID, codigo: "BLOQ", estado: "activo" });
    });
  });

  describe("finalizar", () => {
    it("marca el horario como finalizado", async () => {
      pensumRepo.setPensum(makePensum([makeMateria("M1")]));
      const horario = await service.create(USER_ID, PENSUM_ID, "2026-1", 18, 50);

      await service.finalizar(horario.id, USER_ID);

      const updated = await horarioRepo.findById(horario.id);
      expect(updated!.estado).toBe("finalizado");
      expect(updated!.finalizadoAt).toBeInstanceOf(Date);
    });

    it("lanza NotFoundError si el horario no existe", async () => {
      await expect(service.finalizar("no-existe", USER_ID)).rejects.toThrow(NotFoundError);
    });
  });

  describe("delete", () => {
    it("elimina horario en_progreso y revierte materias a activo", async () => {
      pensumRepo.setPensum(makePensum([makeMateria("M1"), makeMateria("M2")]));
      const horario = await service.create(USER_ID, PENSUM_ID, "2026-1", 18, 50);
      await service.addBloque(horario.id, makeBloque("M1", "lunes", "07:00", "08:40"), USER_ID);
      await service.addBloque(horario.id, makeBloque("M2", "martes", "07:00", "08:40"), USER_ID);

      await service.delete(horario.id, USER_ID);

      const deleted = await horarioRepo.findById(horario.id);
      expect(deleted).toBeNull();
      // Cada bloque debe haber revertido su materia a activo: M1 y M2
      expect(pensumRepo.updateCalls.filter((c) => c.estado === "activo").length).toBe(2);
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
