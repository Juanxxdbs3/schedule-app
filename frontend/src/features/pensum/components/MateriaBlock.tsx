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

  const dragStyle: React.CSSProperties = {
    transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
    touchAction: "none",
  };

  return (
    <div
      ref={setNodeRef}
      className={`bg-surface border border-solid rounded-md p-3 select-none relative transition-all duration-150 ${
        isCursado ? "cursor-not-allowed" : "cursor-grab"
      }`}
      style={{
        ...dragStyle,
        borderColor: colors.border,
        opacity: isDragging ? 0.3 : isCursado ? 0.6 : 1,
        zIndex: isDragging ? 999 : 1,
      }}
      {...listeners}
      {...attributes}
    >
      <div className="flex justify-between items-start mb-2">
        <span className={`text-sm font-semibold font-mono ${isCursado ? "text-muted" : "text-primary"}`}>
          {materia.codigo}
        </span>
        <span
          className="text-sm px-2 py-0.5 rounded-sm"
          style={{ background: colors.badgeBg, color: colors.badgeText }}
        >
          {materia.estado}
        </span>
      </div>
      <div className={`text-base font-semibold mb-1 ${isCursado ? "text-muted" : "text-text"}`}>
        {materia.nombre}
      </div>
      <div className="flex gap-2 text-sm text-muted">
        <span>{materia.creditos} crédito{materia.creditos !== 1 ? "s" : ""}</span>
        <span>•</span>
        <span>Semestre {materia.semestre}</span>
      </div>
    </div>
  );
}
