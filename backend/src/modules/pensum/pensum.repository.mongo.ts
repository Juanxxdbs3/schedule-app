import mongoose, { Schema, Document } from "mongoose";
import { IPensumRepository } from "../../domain/interfaces/index.js";
import { Pensum, Materia, EstadoMateria } from "../../domain/entities/index.js";

// ── Mongoose subdocument interfaces ──────────────────────────────────────────

interface IMateriaSubDoc {
  codigo: string;
  nombre: string;
  creditos: number;
  semestre: number;
  requiere: string[];
  estado: string;
}

interface IPensumDocument extends Document {
  userId: mongoose.Types.ObjectId;
  nombre: string;
  materias: IMateriaSubDoc[];
  createdAt: Date;
  updatedAt: Date;
}

// ── Schemas ──────────────────────────────────────────────────────────────────

const materiaSubSchema = new Schema<IMateriaSubDoc>(
  {
    codigo: { type: String, required: true },
    nombre: { type: String, required: true },
    creditos: { type: Number, required: true },
    semestre: { type: Number, required: true },
    requiere: { type: [String], default: [] },
    estado: {
      type: String,
      enum: ["activo", "matriculado", "cursado", "en_espera"],
      required: true,
    },
  },
  { _id: false },
);

const pensumSchema = new Schema<IPensumDocument>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    nombre: { type: String, required: true },
    materias: { type: [materiaSubSchema], required: true, default: [] },
  },
  { timestamps: true },
);

export const PensumModel = mongoose.model<IPensumDocument>("Pensum", pensumSchema, "pensums");

// ── Mapper ───────────────────────────────────────────────────────────────────

function toPensum(doc: IPensumDocument): Pensum {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    nombre: doc.nombre,
    materias: doc.materias.map((m) => ({
      codigo: m.codigo,
      nombre: m.nombre,
      creditos: m.creditos,
      semestre: m.semestre,
      requiere: m.requiere,
      estado: m.estado as EstadoMateria,
    })),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

// ── Repository implementation ────────────────────────────────────────────────

export class PensumRepositoryMongo implements IPensumRepository {
  async findAllByUserId(userId: string): Promise<Pensum[]> {
    const docs = await PensumModel.find({ userId }).sort({ createdAt: -1 });
    return docs.map(toPensum);
  }

  async findById(id: string): Promise<Pensum | null> {
    const doc = await PensumModel.findById(id);
    if (!doc) return null;
    return toPensum(doc);
  }

  async create(data: { userId: string; nombre: string; materias: Materia[] }): Promise<Pensum> {
    const doc = await PensumModel.create({
      userId: data.userId,
      nombre: data.nombre,
      materias: data.materias,
    });
    return toPensum(doc);
  }

  async updateMateriaEstado(
    pensumId: string,
    materiaCodigo: string,
    nuevoEstado: EstadoMateria,
  ): Promise<void> {
    await PensumModel.findOneAndUpdate(
      { _id: pensumId },
      { $set: { "materias.$[elem].estado": nuevoEstado } },
      { arrayFilters: [{ "elem.codigo": materiaCodigo }] },
    );
  }

  async delete(id: string): Promise<void> {
    await PensumModel.findByIdAndDelete(id);
  }
}
