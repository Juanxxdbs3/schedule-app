import type { Usuario } from "../../domain/entities/index.js";
import type {
  IUserRepository,
  UserWithPasswordHash,
} from "../../domain/interfaces/index.js";

export class FakeUserRepository implements IUserRepository {
  private users = new Map<string, UserWithPasswordHash>();
  private idCounter = 0;

  /** Retrieve all stored users (for assertions). */
  all(): UserWithPasswordHash[] {
    return Array.from(this.users.values());
  }

  /** Replace the in-memory store entirely. Useful in beforeAll/beforeEach. */
  setUsers(users: UserWithPasswordHash[]): void {
    this.users.clear();
    for (const u of users) {
      this.users.set(u.id, u);
    }
    // sync counter so next generated id doesn't collide
    const maxId = users.reduce(
      (max, u) => Math.max(max, Number(u.id)),
      0,
    );
    this.idCounter = Number.isFinite(maxId) ? maxId + 1 : users.length + 1;
  }

  /** Remove all users (call in beforeEach). */
  reset(): void {
    this.users.clear();
    this.idCounter = 0;
  }

  // ------------------------------------------------------------------
  // IUserRepository
  // ------------------------------------------------------------------

  async findByEmail(email: string): Promise<Usuario | null> {
    for (const u of this.users.values()) {
      if (u.email === email) {
        // Return a plain Usuario (no passwordHash)
        const { passwordHash: _, ...usuario } = u;
        return usuario;
      }
    }
    return null;
  }

  async findByEmailWithPassword(
    email: string,
  ): Promise<UserWithPasswordHash | null> {
    for (const u of this.users.values()) {
      if (u.email === email) {
        return { ...u };
      }
    }
    return null;
  }

  async findById(id: string): Promise<Usuario | null> {
    const found = this.users.get(id);
    if (!found) return null;
    const { passwordHash: _, ...usuario } = found;
    return usuario;
  }

  async create(data: {
    username: string;
    email: string;
    passwordHash: string;
  }): Promise<Usuario> {
    const id = String(++this.idCounter);
    const user: UserWithPasswordHash = {
      id,
      username: data.username,
      email: data.email,
      passwordHash: data.passwordHash,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    const { passwordHash: _, ...usuario } = user;
    return usuario;
  }
}
