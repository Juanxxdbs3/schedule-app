import type { Materia } from "../types.ts";

interface MateriaBlockProps {
  materia: Materia;
}

export default function MateriaBlock({ materia }: MateriaBlockProps) {
  const isCursado = materia.estado === "cursado";

  const cardStyle: React.CSSProperties = {
    background: "var(--color-surface)",
    border: `1px solid ${isCursado ? "var(--color-muted-block)" : "var(--color-border)"}`,
    borderRadius: "var(--radius-md)",
    padding: "var(--spacing-3)",
    opacity: isCursado ? 0.6 : 1,
    cursor: isCursado ? "not-allowed" : "grab",
    transition: "box-shadow 0.15s, border-color 0.15s",
    userSelect: "none",
  };

  const headerStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "var(--spacing-2)",
  };

  const codigoStyle: React.CSSProperties = {
    fontSize: "var(--font-size-sm)",
    color: isCursado ? "var(--color-text-muted)" : "var(--color-primary)",
    fontWeight: 600,
    fontFamily: "monospace",
  };

  const nombreStyle: React.CSSProperties = {
    fontSize: "var(--font-size-base)",
    fontWeight: 600,
    color: isCursado ? "var(--color-text-muted)" : "var(--color-text)",
    marginBottom: "var(--spacing-1)",
  };

  const badgeStyle: React.CSSProperties = {
    fontSize: "var(--font-size-sm)",
    padding: "2px 8px",
    borderRadius: "var(--radius-sm)",
    background: isCursado ? "var(--color-muted-block)" : "var(--color-surface-alt)",
    color: isCursado ? "var(--color-text-muted)" : "var(--color-text)",
  };

  const metaStyle: React.CSSProperties = {
    display: "flex",
    gap: "var(--spacing-2)",
    fontSize: "var(--font-size-sm)",
    color: "var(--color-text-muted)",
  };

  return (
    <div style={cardStyle}>
      <div style={headerStyle}>
        <span style={codigoStyle}>{materia.codigo}</span>
        <span style={badgeStyle}>{materia.estado}</span>
      </div>
      <div style={nombreStyle}>{materia.nombre}</div>
      <div style={metaStyle}>
        <span>{materia.creditos} crédito{materia.creditos !== 1 ? "s" : ""}</span>
        <span>•</span>
        <span>Semestre {materia.semestre}</span>
      </div>
    </div>
  );
}
