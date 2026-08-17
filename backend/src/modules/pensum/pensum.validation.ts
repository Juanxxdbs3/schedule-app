import { z } from "zod";

export const materiaSchema = z.object({
  codigo: z.string().min(1),
  nombre: z.string().min(1),
  creditos: z.number().int().positive(),
  semestre: z.number().int().positive(),
  requiere: z.array(z.string()),
  estado: z.enum(["activo", "matriculado", "cursado", "en_espera"]),
});

export const createPensumSchema = z.object({
  nombre: z.string().min(1),
  materias: z.array(materiaSchema).default([]),
});

export const addMateriaSchema = materiaSchema.partial({ estado: true });
