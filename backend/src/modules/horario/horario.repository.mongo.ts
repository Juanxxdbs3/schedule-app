import mongoose, { Schema, Document } from "mongoose";
import { IHorarioRepository } from "../../domain/interfaces/index.js";
import { Horario, Bloque, DiaSemana, EstadoHorario } from "../../domain/entities/index.js";

// ── Mongoose interfaces ───────────────────────────────────────────────────────

interface IBloqueSubDoc {
  materiaCodigo: string;
  dia: string;
  horaInicio: string;
  horaFin: string;
  nombrePersonalizado?: string;
  profesor?: string;
  salon?: string;
}

interface IHorarioDocument extends Document {
  userId: mongoose.Types.ObjectId;
  pensumId: mongoose.Types.ObjectId;
  semestreLabel: string;
  maxCreditos: number;
  unidadHoraMinutos: number;
  estado: string;
  bloques: IBloqueSubDoc[];
  resultados: Map<string, string>;
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
    nombrePersonalizado: { type: String },
    profesor: { type: String },
    salon: { type: String },
  },
  { _id: true },
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
    resultados: { type: Map, of: String, default: {} },
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
    bloques: doc.bloques.map((b) => {
      const bloque: Bloque = {
        id: (b as any)._id?.toString() ?? new mongoose.Types.ObjectId().toString(),
        materiaCodigo: b.materiaCodigo,
        dia: b.dia as DiaSemana,
        horaInicio: b.horaInicio,
        horaFin: b.horaFin,
      };
      if (b.nombrePersonalizado) bloque.nombrePersonalizado = b.nombrePersonalizado;
      if (b.profesor) bloque.profesor = b.profesor;
      if (b.salon) bloque.salon = b.salon;
      return bloque;
    }),
    resultados: Object.fromEntries(doc.resultados ?? []) as Record<string, 'aprobada' | 'perdida'>,
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
      resultados: {},
      finalizadoAt: null,
    });
    return toHorario(doc);
  }

  async addBloque(horarioId: string, bloque: Bloque): Promise<void> {
    await HorarioModel.findByIdAndUpdate(horarioId, {
      $push: { bloques: bloque },
    });
  }

  async removeBloqueById(horarioId: string, bloqueId: string): Promise<void> {
    await HorarioModel.findByIdAndUpdate(horarioId, {
      $pull: { bloques: { _id: bloqueId } },
    });
  }

  async replaceBloques(horarioId: string, bloques: Bloque[]): Promise<void> {
    await HorarioModel.findByIdAndUpdate(horarioId, {
      $set: { bloques },
    });
  }

  async setResultado(
    horarioId: string,
    materiaCodigo: string,
    resultado: 'aprobada' | 'perdida' | null,
  ): Promise<void> {
    if (resultado) {
      await HorarioModel.findByIdAndUpdate(horarioId, {
        $set: { [`resultados.${materiaCodigo}`]: resultado },
      });
    } else {
      await HorarioModel.findByIdAndUpdate(horarioId, {
        $unset: { [`resultados.${materiaCodigo}`]: "" },
      });
    }
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
