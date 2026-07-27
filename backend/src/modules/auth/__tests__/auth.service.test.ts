import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthService } from "../auth.service.js";
import { FakeUserRepository } from "../../../__tests__/fakes/FakeUserRepository.js";
import { ValidationError, NotFoundError } from "../../../shared/errors/AppError.js";

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn(() => Promise.resolve("hashed-password")),
    compare: vi.fn(),
  },
  hash: vi.fn(() => Promise.resolve("hashed-password")),
  compare: vi.fn(),
}));

vi.mock("jsonwebtoken", () => ({
  default: {
    sign: vi.fn(() => "fake-jwt-token"),
  },
  sign: vi.fn(() => "fake-jwt-token"),
}));

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

function mockRes(): any {
  return { cookie: vi.fn() };
}

describe("AuthService", () => {
  let service: AuthService;
  let userRepo: FakeUserRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    userRepo = new FakeUserRepository();
    service = new AuthService(userRepo);
  });

  describe("register", () => {
    it("crea un usuario y retorna Usuario sin passwordHash", async () => {
      const user = await service.register("testuser", "test@test.com", "password123");

      expect(user).toBeDefined();
      expect(user.username).toBe("testuser");
      expect(user.email).toBe("test@test.com");
      expect((user as any).passwordHash).toBeUndefined();
    });

    it("lanza ValidationError si el email ya existe", async () => {
      await service.register("user1", "dup@test.com", "pass123");

      await expect(service.register("user2", "dup@test.com", "pass456")).rejects.toThrow(ValidationError);
    });

    it("hashea la contraseña con bcrypt antes de guardar", async () => {
      await service.register("u", "a@b.com", "mypass");

      expect(bcrypt.hash).toHaveBeenCalledWith("mypass", 10);
      const stored = userRepo.all();
      expect(stored[0].passwordHash).toBe("hashed-password");
    });
  });

  describe("login", () => {
    beforeEach(async () => {
      (bcrypt.compare as any).mockResolvedValue(true);
      await service.register("testuser", "test@test.com", "password123");
    });

    it("retorna usuario y setea cookie httpOnly con JWT", async () => {
      const res = mockRes();
      const user = await service.login("test@test.com", "password123", res);

      expect(user.email).toBe("test@test.com");
      expect(user.username).toBe("testuser");
      expect((user as any).passwordHash).toBeUndefined();
      expect(jwt.sign).toHaveBeenCalledWith({ userId: expect.any(String) }, expect.any(String), { expiresIn: "7d" });
      expect(res.cookie).toHaveBeenCalledWith("token", "fake-jwt-token", expect.objectContaining({ httpOnly: true }));
    });

    it("lanza NotFoundError si el email no existe", async () => {
      await expect(service.login("no@exist.com", "pass", mockRes())).rejects.toThrow(NotFoundError);
    });

    it("lanza NotFoundError si la contraseña es incorrecta", async () => {
      (bcrypt.compare as any).mockResolvedValue(false);

      await expect(service.login("test@test.com", "wrongpass", mockRes())).rejects.toThrow(NotFoundError);
    });
  });

  describe("me", () => {
    it("retorna el usuario si existe", async () => {
      const created = await service.register("u", "x@y.com", "pass");

      const result = await service.me(created.id);
      expect(result.email).toBe("x@y.com");
    });

    it("lanza NotFoundError si el usuario no existe", async () => {
      await expect(service.me("nonexistent-id")).rejects.toThrow(NotFoundError);
    });
  });
});
