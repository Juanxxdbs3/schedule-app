import { describe, it, expect, beforeEach } from "vitest";
import { PensumService } from "../pensum.service.js";
import { FakePensumRepository } from "../../../__tests__/fakes/FakePensumRepository.js";
import { NotFoundError, ValidationError } from "../../../shared/errors/AppError.js";
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

  describe("agregarMateria", () => {
    it("agrega una materia y devuelve el pensum actualizado", async () => {
      const created = await service.create(USER_ID, { nombre: "P1", materias: [makeMateria("M1")] });

      const updated = await service.agregarMateria(created.id, USER_ID, {
        codigo: "M2", nombre: "Materia M2", creditos: 4, semestre: 2, requiere: ["M1"],
      });

      expect(updated.materias).toHaveLength(2);
      const nueva = updated.materias.find((m) => m.codigo === "M2");
      expect(nueva).toMatchObject({ codigo: "M2", creditos: 4, semestre: 2, requiere: ["M1"] });
      expect(nueva?.estado).toBe("activo");
    });

    it("respeta el estado enviado si se especifica", async () => {
      const created = await service.create(USER_ID, { nombre: "P1", materias: [] });

      const updated = await service.agregarMateria(created.id, USER_ID, {
        codigo: "M9", nombre: "Materia M9", creditos: 2, semestre: 1, requiere: [], estado: "en_espera",
      });

      expect(updated.materias.find((m) => m.codigo === "M9")?.estado).toBe("en_espera");
    });

    it("lanza ValidationError si el código ya existe en el pensum", async () => {
      const created = await service.create(USER_ID, { nombre: "P1", materias: [makeMateria("M1")] });

      await expect(
        service.agregarMateria(created.id, USER_ID, {
          codigo: "M1", nombre: "Duplicada", creditos: 3, semestre: 1, requiere: [],
        }),
      ).rejects.toThrow(ValidationError);
    });

    it("lanza ValidationError si 'requiere' incluye códigos que no existen en el pensum", async () => {
      const created = await service.create(USER_ID, { nombre: "P1", materias: [makeMateria("M1")] });

      await expect(
        service.agregarMateria(created.id, USER_ID, {
          codigo: "M2", nombre: "Materia M2", creditos: 3, semestre: 2, requiere: ["M1", "NOEXISTE"],
        }),
      ).rejects.toThrow(/NOEXISTE/);
    });

    it("lanza ValidationError si la materia se requiere a sí misma", async () => {
      const created = await service.create(USER_ID, { nombre: "P1", materias: [] });

      await expect(
        service.agregarMateria(created.id, USER_ID, {
          codigo: "M3", nombre: "Materia M3", creditos: 3, semestre: 1, requiere: ["M3"],
        }),
      ).rejects.toThrow(/a sí misma/);
    });

    it("lanza NotFoundError si el pensum no pertenece al usuario", async () => {
      const created = await service.create(USER_ID, { nombre: "P1", materias: [] });

      await expect(
        service.agregarMateria(created.id, "other-user", {
          codigo: "M5", nombre: "Ajena", creditos: 3, semestre: 1, requiere: [],
        }),
      ).rejects.toThrow(NotFoundError);
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
