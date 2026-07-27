import { useDraggable } from "@dnd-kit/core";
import type { Bloque } from "../types.ts";
import type { Materia } from "../../pensum/types.ts";

interface MateriaSlotProps {
  bloque: Bloque;
  materia: Materia;
  conflicto: boolean;
  onClick?: () => void;
}

export default function MateriaSlot({ bloque, materia, conflicto, onClick }: MateriaSlotProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `placed-${materia.codigo}`,
    data: { type: "placed", materia, bloque },
  });

  const style: React.CSSProperties = {
    padding: "3px 6px",
    borderRadius: "var(--radius-sm)",
    fontSize: "11px",
    cursor: "grab",
    background: conflicto
      ? "var(--color-danger-bg, #fef2f2)"
      : "var(--color-primary-muted, #dbeafe)",
    border: `1px solid ${conflicto ? "var(--color-danger, #ef4444)" : "var(--color-primary)"}`,
    color: conflicto ? "var(--color-danger, #ef4444)" : "var(--color-primary)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    position: "relative",
    userSelect: "none",
    touchAction: "none",
    transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} onClick={onClick} title={materia.nombre}>
      <div style={{ fontWeight: 600, lineHeight: 1.2 }}>{materia.codigo}</div>
      <div style={{ fontSize: 10, lineHeight: 1.2, opacity: 0.8 }}>
        {bloque.horaInicio}–{bloque.horaFin}
      </div>
    </div>
  );
}
