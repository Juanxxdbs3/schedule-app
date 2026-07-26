import mongoose, { Schema, Document } from "mongoose";
import { IUserRepository, UserWithPasswordHash } from "../../domain/interfaces/index.js";
import { Usuario } from "../../domain/entities/index.js";

export interface IUserDocument extends Document {
  username: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
}

const userSchema = new Schema<IUserDocument>({
  username: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true, select: false },
  createdAt: { type: Date, default: Date.now },
});

export const UserModel = mongoose.model<IUserDocument>("User", userSchema);

function toUsuario(doc: IUserDocument): Usuario {
  return {
    id: doc._id.toString(),
    username: doc.username,
    email: doc.email,
    createdAt: doc.createdAt,
  };
}

function toUserWithPassword(doc: IUserDocument): UserWithPasswordHash {
  return {
    id: doc._id.toString(),
    username: doc.username,
    email: doc.email,
    passwordHash: doc.passwordHash,
    createdAt: doc.createdAt,
  };
}

export class UserRepositoryMongo implements IUserRepository {
  async findByEmail(email: string): Promise<Usuario | null> {
    const doc = await UserModel.findOne({ email });
    if (!doc) return null;
    return toUsuario(doc);
  }

  async findByEmailWithPassword(email: string): Promise<UserWithPasswordHash | null> {
    const doc = await UserModel.findOne({ email }).select("+passwordHash");
    if (!doc) return null;
    return toUserWithPassword(doc);
  }

  async findById(id: string): Promise<Usuario | null> {
    const doc = await UserModel.findById(id);
    if (!doc) return null;
    return toUsuario(doc);
  }

  async create(data: { username: string; email: string; passwordHash: string }): Promise<Usuario> {
    const doc = await UserModel.create(data);
    return toUsuario(doc);
  }
}
