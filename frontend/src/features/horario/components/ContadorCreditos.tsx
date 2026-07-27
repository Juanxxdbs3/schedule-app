import type { Bloque } from "../types.ts";
import type { Materia } from "../../pensum/types.ts";

interface ContadorCreditosProps {
  bloques: Bloque[];
  materias: Materia[];
  maxCreditos: number;
}

export default function ContadorCreditos({ bloques, materias, maxCreditos }: ContadorCreditosProps) {
  const usados = bloques.reduce((total, b) => {
    const m = materias.find((m) => m.codigo === b.materiaCodigo);
    return total + (m?.creditos ?? 0);
  }, 0);

  const excedido = usados > maxCreditos;

  return (
    <div
      style={{
        padding: "var(--spacing-2) var(--spacing-3)",
        borderRadius: "var(--radius-md)",
        background: excedido ? "var(--color-danger-bg, #fef2f2)" : "var(--color-surface)",
        border: `1px solid ${excedido ? "var(--color-danger, #ef4444)" : "var(--color-border)"}`,
        fontSize: "var(--font-size-sm)",
        fontWeight: 500,
        color: excedido ? "var(--color-danger, #ef4444)" : "var(--color-text)",
        whiteSpace: "nowrap",
      }}
    >
      Créditos: {usados} / {maxCreditos}
    </div>
  );
}
