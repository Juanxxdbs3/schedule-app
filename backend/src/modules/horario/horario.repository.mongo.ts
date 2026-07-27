import mongoose, { Schema, Document } from "mongoose";
import { IHorarioRepository } from "../../domain/interfaces/index.js";
import { Horario, Bloque, DiaSemana, EstadoHorario } from "../../domain/entities/index.js";

// ── Mongoose interfaces ───────────────────────────────────────────────────────

interface IBloqueSubDoc {
  materiaCodigo: string;
  dia: string;
  horaInicio: string;
  horaFin: string;
}

interface IHorarioDocument extends Document {
  userId: mongoose.Types.ObjectId;
  pensumId: mongoose.Types.ObjectId;
  semestreLabel: string;
  maxCreditos: number;
  unidadHoraMinutos: number;
  estado: string;
  bloques: IBloqueSubDoc[];
  createdAt: Date;
  finalizadoAt: Date | null;
}

// ── Schemas ───────────────────────────────────────────────────────────────────

const bloqueSubSchema = new Schema<IBloqueSubDoc>(
  {
    materiaCodigo: { type: String, required: true },
    dia: {
      type: String,
      enum: ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"],
      required: true,
    },
    horaInicio: { type: String, required: true },
    horaFin: { type: String, required: true },
  },
  { _id: false },
);

const horarioSchema = new Schema<IHorarioDocument>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    pensumId: { type: Schema.Types.ObjectId, required: true, index: true },
    semestreLabel: { type: String, required: true },
    maxCreditos: { type: Number, required: true },
    unidadHoraMinutos: { type: Number, required: true },
    estado: {
      type: String,
      enum: ["en_progreso", "finalizado"],
      default: "en_progreso",
    },
    bloques: { type: [bloqueSubSchema], default: [] },
    finalizadoAt: { type: Date, default: null },
  },
  { timestamps: true },
);

horarioSchema.index({ userId: 1, estado: 1 });

export const HorarioModel = mongoose.model<IHorarioDocument>("Horario", horarioSchema, "horarios");

// ── Mapper ────────────────────────────────────────────────────────────────────

function toHorario(doc: IHorarioDocument): Horario {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    pensumId: doc.pensumId.toString(),
    semestreLabel: doc.semestreLabel,
    maxCreditos: doc.maxCreditos,
    unidadHoraMinutos: doc.unidadHoraMinutos,
    estado: doc.estado as EstadoHorario,
    bloques: doc.bloques.map((b) => ({
      materiaCodigo: b.materiaCodigo,
      dia: b.dia as DiaSemana,
      horaInicio: b.horaInicio,
      horaFin: b.horaFin,
    })),
    createdAt: doc.createdAt,
    finalizadoAt: doc.finalizadoAt,
  };
}

// ── Repository implementation ─────────────────────────────────────────────────

export class HorarioRepositoryMongo implements IHorarioRepository {
  async findByUserId(userId: string): Promise<Horario[]> {
    const docs = await HorarioModel.find({ userId }).sort({ createdAt: -1 });
    return docs.map(toHorario);
  }

  async findById(id: string): Promise<Horario | null> {
    const doc = await HorarioModel.findById(id);
    if (!doc) return null;
    return toHorario(doc);
  }

  async create(data: {
    userId: string;
    pensumId: string;
    semestreLabel: string;
    maxCreditos: number;
    unidadHoraMinutos: number;
  }): Promise<Horario> {
    const doc = await HorarioModel.create({
      userId: data.userId,
      pensumId: data.pensumId,
      semestreLabel: data.semestreLabel,
      maxCreditos: data.maxCreditos,
      unidadHoraMinutos: data.unidadHoraMinutos,
      estado: "en_progreso",
      bloques: [],
      finalizadoAt: null,
    });
    return toHorario(doc);
  }

  async addBloque(horarioId: string, bloque: Bloque): Promise<void> {
    await HorarioModel.findByIdAndUpdate(horarioId, {
      $push: { bloques: bloque },
    });
  }

  async removeBloque(horarioId: string, materiaCodigo: string): Promise<void> {
    await HorarioModel.findByIdAndUpdate(horarioId, {
      $pull: { bloques: { materiaCodigo } },
    });
  }

  async replaceBloques(horarioId: string, bloques: Bloque[]): Promise<void> {
    await HorarioModel.findByIdAndUpdate(horarioId, {
      $set: { bloques },
    });
  }

  async finalizar(horarioId: string, finalizadoAt: Date): Promise<void> {
    await HorarioModel.findByIdAndUpdate(horarioId, {
      $set: { estado: "finalizado", finalizadoAt },
    });
  }

  async delete(id: string): Promise<void> {
    await HorarioModel.findByIdAndDelete(id);
  }
}
