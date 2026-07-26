import type { Materia } from "../types.ts";
import MateriaBlock from "./MateriaBlock.tsx";

interface PoolMateriasProps {
  materias: Materia[];
}

export default function PoolMaterias({ materias }: PoolMateriasProps) {
  const disponibles = materias.filter((m) => m.estado !== "cursado");

  if (disponibles.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "var(--spacing-4)",
          color: "var(--color-text-muted)",
          border: "2px dashed var(--color-border)",
          borderRadius: "var(--radius-md)",
        }}
      >
        No hay materias disponibles
      </div>
    );
  }

  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: "var(--spacing-3)",
  };

  return (
    <div>
      <p
        style={{
          fontSize: "var(--font-size-sm)",
          color: "var(--color-text-muted)",
          marginBottom: "var(--spacing-3)",
        }}
      >
        {disponibles.length} materia{disponibles.length !== 1 ? "s" : ""} disponible
        {disponibles.length !== 1 ? "s" : ""}
      </p>
      <div style={gridStyle}>
        {disponibles.map((m) => (
          <MateriaBlock key={m.codigo} materia={m} />
        ))}
      </div>
    </div>
  );
}
