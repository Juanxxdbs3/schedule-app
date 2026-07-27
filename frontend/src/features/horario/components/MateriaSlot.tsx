import { useDraggable } from "@dnd-kit/core";
import type { Bloque, ModoHorario } from "../types.ts";
import type { Materia } from "../../pensum/types.ts";

interface MateriaSlotProps {
  bloque: Bloque;
  materia: Materia;
  conflicto: boolean;
  span: number;
  modo: ModoHorario;
  resultado?: boolean;
  onRemove?: () => void;
  onExpandDown?: () => void;
  onExpandUp?: () => void;
  onMarcar?: (aprobada: boolean) => void;
}

const COLOR_BY_ESTADO: Record<string, { border: string; bg: string; text: string }> = {
  activo: { border: "#d97706", bg: "#fef3c7", text: "#92400e" },
  matriculado: { border: "#16a34a", bg: "#dcfce7", text: "#166534" },
  cursado: { border: "#9ca3af", bg: "#f3f4f6", text: "#6b7280" },
  en_espera: { border: "#2563eb", bg: "#dbeafe", text: "#1e40af" },
};

export default function MateriaSlot({ bloque, materia, conflicto, span, modo, resultado, onRemove, onExpandDown, onExpandUp, onMarcar }: MateriaSlotProps) {
  const colors = COLOR_BY_ESTADO[materia.estado] ?? COLOR_BY_ESTADO.activo;
  const isEdicion = modo === "edicion";

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `placed-${materia.codigo}`,
    data: { type: "placed", materia, bloque },
    disabled: !isEdicion,
  });

  const bg = conflicto ? "#fef2f2" : resultado === true ? "#f5f3ff" : resultado === false ? "#fff7ed" : colors.bg;

  const containerStyle: React.CSSProperties = {
    padding: isEdicion ? "2px" : "4px 6px",
    borderRadius: "var(--radius-sm)",
    fontSize: "11px",
    cursor: isEdicion ? "grab" : "default",
    background: bg,
    border: `1px solid ${conflicto ? "#ef4444" : resultado === true ? "#7c3aed" : resultado === false ? "#ea580c" : colors.border}`,
    color: conflicto ? "#ef4444" : colors.text,
    overflow: "visible",
    userSelect: "none",
    touchAction: isEdicion ? "none" : "auto",
    transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : 1,
    position: "relative",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    boxSizing: "border-box",
  };

  const handleInvisibleStyle: React.CSSProperties = {
    position: "absolute",
    left: 0,
    right: 0,
    height: 12,
    cursor: "ns-resize",
    zIndex: 10,
    userSelect: "none",
    touchAction: "none",
  };

  function makeDragHandler(dir: "up" | "down", cb: (() => void) | undefined) {
    if (!cb) return undefined;
    return (e: React.PointerEvent) => {
      e.stopPropagation();
      const startY = e.clientY;
      const threshold = 20;
      const onMove = (ev: PointerEvent) => {
        const delta = ev.clientY - startY;
        if ((dir === "down" && delta > threshold) || (dir === "up" && delta < -threshold)) {
          cb();
          cleanup();
        }
      };
      const onUp = () => cleanup();
      const cleanup = () => {
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerup", onUp);
      };
      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", onUp);
    };
  }

  return (
    <div ref={setNodeRef} style={containerStyle} {...(isEdicion ? { ...listeners, ...attributes } : {})} title={materia.nombre}>
      {/* Top expand handle */}
      {isEdicion && onExpandUp && (
        <div
          style={{ ...handleInvisibleStyle, top: -6 }}
          onPointerDown={makeDragHandler("up", onExpandUp)}
        >
          <div style={{ textAlign: "center", fontSize: 10, color: colors.border, opacity: 0.5, lineHeight: 1 }}>⋮</div>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontWeight: 600, lineHeight: 1.3 }}>{materia.nombre}</div>
          <div style={{ fontSize: 10, lineHeight: 1.2, opacity: 0.8 }}>
            {bloque.horaInicio}–{bloque.horaFin}
          </div>
        </div>
        {isEdicion && onRemove && (
          <button type="button" onClick={(e) => { e.stopPropagation(); onRemove(); }} style={{
            width: 16, height: 16, padding: 0, border: "none", borderRadius: "50%",
            cursor: "pointer", fontSize: 10, lineHeight: "16px", textAlign: "center",
            background: "rgba(0,0,0,0.1)", color: "#666", flexShrink: 0, marginLeft: 2,
          }} title="Quitar del horario">✕</button>
        )}
      </div>

      {/* Result */}
      {modo === "curso" && resultado !== undefined && (
        <div style={{ fontSize: 14, textAlign: "center", lineHeight: 1, marginTop: 2 }}>
          {resultado ? "😊" : "😢"}
        </div>
      )}

      {/* Emoji buttons */}
      {modo === "curso" && onMarcar && (
        <div style={{ display: "flex", gap: 4, justifyContent: "center", marginTop: 2 }}>
          <button type="button" onClick={(e) => { e.stopPropagation(); onMarcar(true); }} style={{
            padding: "0 4px", border: resultado === true ? "1px solid #7c3aed" : "1px solid transparent",
            borderRadius: "var(--radius-sm)", cursor: "pointer", fontSize: 14, lineHeight: "18px",
            background: resultado === true ? "#f5f3ff" : "transparent",
            opacity: resultado === true ? 1 : 0.5,
          }} title="Aprobada">😊</button>
          <button type="button" onClick={(e) => { e.stopPropagation(); onMarcar(false); }} style={{
            padding: "0 4px", border: resultado === false ? "1px solid #ea580c" : "1px solid transparent",
            borderRadius: "var(--radius-sm)", cursor: "pointer", fontSize: 14, lineHeight: "18px",
            background: resultado === false ? "#fff7ed" : "transparent",
            opacity: resultado === false ? 1 : 0.5,
          }} title="Perdida">😢</button>
        </div>
      )}

      {/* Bottom expand handle */}
      {isEdicion && onExpandDown && span < 5 && (
        <div
          style={{ ...handleInvisibleStyle, bottom: -6 }}
          onPointerDown={makeDragHandler("down", onExpandDown)}
        >
          <div style={{ textAlign: "center", fontSize: 10, color: colors.border, opacity: 0.5, lineHeight: 1 }}>⋮</div>
        </div>
      )}
    </div>
  );
}
