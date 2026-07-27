import { useDraggable } from "@dnd-kit/core";
import type { Materia } from "../types.ts";

interface MateriaBlockProps {
  materia: Materia;
}

const COLOR_BY_ESTADO: Record<string, { border: string; badgeBg: string; badgeText: string }> = {
  activo: { border: "#d97706", badgeBg: "#fef3c7", badgeText: "#92400e" },
  matriculado: { border: "#16a34a", badgeBg: "#dcfce7", badgeText: "#166534" },
  en_espera: { border: "#2563eb", badgeBg: "#dbeafe", badgeText: "#1e40af" },
  cursado: { border: "var(--color-muted-block)", badgeBg: "var(--color-muted-block)", badgeText: "var(--color-text-muted)" },
};

export default function MateriaBlock({ materia }: MateriaBlockProps) {
  const isCursado = materia.estado === "cursado";
  const colors = COLOR_BY_ESTADO[materia.estado] ?? COLOR_BY_ESTADO.activo;

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `pool-${materia.codigo}`,
    data: { type: "materia", materia },
    disabled: isCursado,
  });

  const cardStyle: React.CSSProperties = {
    background: "var(--color-surface)",
    border: `1px solid ${colors.border}`,
    borderRadius: "var(--radius-md)",
    padding: "var(--spacing-3)",
    opacity: isDragging ? 0.3 : isCursado ? 0.6 : 1,
    cursor: isCursado ? "not-allowed" : "grab",
    transition: "box-shadow 0.15s, border-color 0.15s, opacity 0.15s",
    userSelect: "none",
    touchAction: "none",
    transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
    position: "relative" as const,
    zIndex: isDragging ? 999 : 1,
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
    background: colors.badgeBg,
    color: colors.badgeText,
  };

  const metaStyle: React.CSSProperties = {
    display: "flex",
    gap: "var(--spacing-2)",
    fontSize: "var(--font-size-sm)",
    color: "var(--color-text-muted)",
  };

  return (
    <div ref={setNodeRef} style={cardStyle} {...listeners} {...attributes}>
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
