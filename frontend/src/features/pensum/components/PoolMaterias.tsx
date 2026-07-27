import type { Materia } from "../types.ts";
import MateriaBlock from "./MateriaBlock.tsx";

interface PoolMateriasProps {
  materias: Materia[];
}

const ORDER: Record<string, number> = {
  matriculado: 0,
  activo: 1,
  en_espera: 2,
  cursado: 3,
};

export default function PoolMaterias({ materias }: PoolMateriasProps) {
  const ordenadas = [...materias].sort((a, b) => (ORDER[a.estado] ?? 99) - (ORDER[b.estado] ?? 99));

  if (ordenadas.length === 0) {
    return (
      <div style={{
        textAlign: "center", padding: "var(--spacing-4)",
        color: "var(--color-text-muted)", border: "2px dashed var(--color-border)",
        borderRadius: "var(--radius-md)",
      }}>
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
      <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)", marginBottom: "var(--spacing-3)" }}>
        {ordenadas.length} materia{ordenadas.length !== 1 ? "s" : ""} disponible{ordenadas.length !== 1 ? "s" : ""}
      </p>
      <div style={gridStyle}>
        {ordenadas.map((m) => (
          <MateriaBlock key={m.codigo} materia={m} />
        ))}
      </div>
    </div>
  );
}
