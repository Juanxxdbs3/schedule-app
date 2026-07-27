import type { Bloque } from "../types.ts";
import type { Materia } from "../../pensum/types.ts";

interface ContadorCreditosProps {
  bloques: Bloque[];
  materias: Materia[];
  maxCreditos: number;
}

export default function ContadorCreditos({ bloques, materias, maxCreditos }: ContadorCreditosProps) {
  const materiaMap = new Map(materias.map((m) => [m.codigo, m]));
  const codigosUnicos = new Set(bloques.map((b) => b.materiaCodigo));
  const usados = [...codigosUnicos].reduce((total, c) => total + (materiaMap.get(c)?.creditos ?? 0), 0);

  const excedido = usados > maxCreditos;

  return (
    <div
      className={`px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap ${
        excedido
          ? "bg-danger-bg border border-solid border-danger text-danger"
          : "bg-surface border border-solid border-border text-text"
      }`}
    >
      Créditos: {usados} / {maxCreditos}
    </div>
  );
}
