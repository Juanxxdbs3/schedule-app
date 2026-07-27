import { describe, it, expect, beforeEach } from "vitest";
import { PensumService } from "../pensum.service.js";
import { FakePensumRepository } from "../../../__tests__/fakes/FakePensumRepository.js";
import { NotFoundError } from "../../../shared/errors/AppError.js";
import type { Materia } from "../../../domain/entities/index.js";

function makeMateria(codigo: string): Materia {
  return { codigo, nombre: `Materia ${codigo}`, creditos: 3, semestre: 1, requiere: [], estado: "activo" };
}

const USER_ID = "user-1";

describe("PensumService", () => {
  let service: PensumService;
  let pensumRepo: FakePensumRepository;

  beforeEach(() => {
    pensumRepo = new FakePensumRepository();
    service = new PensumService(pensumRepo);
  });

  describe("create", () => {
    it("crea un pensum con materias", async () => {
      const materias = [makeMateria("M1"), makeMateria("M2")];
      const pensum = await service.create(USER_ID, { nombre: "Mi Pensum", materias });

      expect(pensum.nombre).toBe("Mi Pensum");
      expect(pensum.userId).toBe(USER_ID);
      expect(pensum.materias).toHaveLength(2);
    });
  });

  describe("list", () => {
    it("retorna solo los pensums del usuario", async () => {
      await service.create(USER_ID, { nombre: "P1", materias: [makeMateria("M1")] });
      await service.create("other-user", { nombre: "P2", materias: [makeMateria("M2")] });

      const list = await service.list(USER_ID);
      expect(list).toHaveLength(1);
      expect(list[0].nombre).toBe("P1");
    });
  });

  describe("getById", () => {
    it("retorna el pensum si existe y pertenece al usuario", async () => {
      const created = await service.create(USER_ID, { nombre: "P1", materias: [makeMateria("M1")] });

      const found = await service.getById(created.id, USER_ID);
      expect(found.nombre).toBe("P1");
    });

    it("lanza NotFoundError si el pensum no existe", async () => {
      await expect(service.getById("no-existe", USER_ID)).rejects.toThrow(NotFoundError);
    });

    it("lanza NotFoundError si el pensum no pertenece al usuario", async () => {
      const created = await service.create(USER_ID, { nombre: "P1", materias: [makeMateria("M1")] });

      await expect(service.getById(created.id, "other-user")).rejects.toThrow(NotFoundError);
    });
  });

  describe("updateMateriaEstado", () => {
    it("actualiza el estado de una materia en el pensum", async () => {
      const created = await service.create(USER_ID, { nombre: "P1", materias: [makeMateria("M1")] });

      await service.updateMateriaEstado(created.id, "M1", "matriculado", USER_ID);
      expect(pensumRepo.updateCalls).toHaveLength(1);
      expect(pensumRepo.updateCalls[0]).toEqual({ pensumId: created.id, codigo: "M1", estado: "matriculado" });
    });

    it("lanza NotFoundError si el pensum no existe", async () => {
      await expect(service.updateMateriaEstado("no-existe", "M1", "activo", USER_ID)).rejects.toThrow(NotFoundError);
    });
  });

  describe("delete", () => {
    it("elimina un pensum existente", async () => {
      const created = await service.create(USER_ID, { nombre: "P1", materias: [makeMateria("M1")] });

      await service.delete(created.id, USER_ID);
      const list = await service.list(USER_ID);
      expect(list).toHaveLength(0);
    });

    it("lanza NotFoundError si el pensum no existe", async () => {
      await expect(service.delete("no-existe", USER_ID)).rejects.toThrow(NotFoundError);
    });
  });
});
