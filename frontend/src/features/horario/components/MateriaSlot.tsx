import { useDraggable } from "@dnd-kit/core";
import type { Bloque } from "../types.ts";
import type { Materia } from "../../pensum/types.ts";
import type { ModoHorario } from "../types.ts";

interface MateriaSlotProps {
  bloque: Bloque;
  materia: Materia;
  conflicto: boolean;
  span: number;
  modo: ModoHorario;
  resultado?: boolean;
  onRemove?: () => void;
  onExpand?: (unidades: number) => void;
  onMarcar?: (aprobada: boolean) => void;
}

const COLOR_BY_ESTADO: Record<string, { border: string; bg: string; text: string }> = {
  activo: { border: "#d97706", bg: "#fef3c7", text: "#92400e" },
  matriculado: { border: "#16a34a", bg: "#dcfce7", text: "#166534" },
  cursado: { border: "#9ca3af", bg: "#f3f4f6", text: "#6b7280" },
  en_espera: { border: "#2563eb", bg: "#dbeafe", text: "#1e40af" },
};

export default function MateriaSlot({ bloque, materia, conflicto, span, modo, resultado, onRemove, onExpand, onMarcar }: MateriaSlotProps) {
  const colors = COLOR_BY_ESTADO[materia.estado] ?? COLOR_BY_ESTADO.activo;
  const isEdicion = modo === "edicion";

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `placed-${materia.codigo}`,
    data: { type: "placed", materia, bloque },
    disabled: !isEdicion,
  });

  const slotHeight = 52;
  const totalHeight = slotHeight * span;

  const bg = conflicto ? "#fef2f2" : resultado === true ? "#f0fdf4" : resultado === false ? "#fef2f2" : colors.bg;

  const containerStyle: React.CSSProperties = {
    padding: isEdicion ? "2px" : "4px 6px",
    borderRadius: "var(--radius-sm)",
    fontSize: "11px",
    cursor: isEdicion ? "grab" : "default",
    background: bg,
    border: `1px solid ${conflicto ? "#ef4444" : resultado === true ? "#22c55e" : resultado === false ? "#ef4444" : colors.border}`,
    color: conflicto ? "#ef4444" : colors.text,
    overflow: "hidden",
    userSelect: "none",
    touchAction: isEdicion ? "none" : "auto",
    transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : 1,
    position: "relative",
    width: "100%",
    height: span > 1 ? totalHeight - 4 : "auto",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  };

  const iconBtnStyle: React.CSSProperties = {
    position: "absolute",
    top: 1,
    right: 1,
    width: 16,
    height: 16,
    padding: 0,
    border: "none",
    borderRadius: "50%",
    cursor: isEdicion ? "pointer" : "pointer",
    fontSize: 10,
    lineHeight: "16px",
    textAlign: "center",
    background: "rgba(0,0,0,0.1)",
    color: "#666",
    zIndex: 5,
  };

  return (
    <div ref={setNodeRef} style={containerStyle} {...(isEdicion ? { ...listeners, ...attributes } : {})} title={materia.nombre}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontWeight: 600, lineHeight: 1.3 }}>{materia.codigo}</div>
          <div style={{ fontSize: 10, lineHeight: 1.2, opacity: 0.8 }}>
            {bloque.horaInicio}–{bloque.horaFin}
          </div>
        </div>
        {isEdicion && onRemove && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            style={{
              ...iconBtnStyle,
              position: "static",
              flexShrink: 0,
              marginLeft: 2,
            }}
            title="Quitar del horario"
          >
            ✕
          </button>
        )}
      </div>

      {/* Resultado indicator */}
      {modo === "curso" && resultado !== undefined && (
        <div style={{
          fontSize: 14, textAlign: "center", lineHeight: 1,
          marginTop: 2,
        }}>
          {resultado ? "😊" : "😢"}
        </div>
      )}

      {/* Emoji buttons in curso mode */}
      {modo === "curso" && onMarcar && (
        <div style={{ display: "flex", gap: 4, justifyContent: "center", marginTop: 2 }}>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onMarcar(true); }}
            style={{
              padding: "0 4px", border: "none", borderRadius: "var(--radius-sm)",
              cursor: "pointer", fontSize: 14, lineHeight: "18px",
              background: resultado === true ? "#dcfce7" : "transparent",
              opacity: resultado === true ? 1 : 0.5,
            }}
            title="Aprobada"
          >
            😊
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onMarcar(false); }}
            style={{
              padding: "0 4px", border: "none", borderRadius: "var(--radius-sm)",
              cursor: "pointer", fontSize: 14, lineHeight: "18px",
              background: resultado === false ? "#fef2f2" : "transparent",
              opacity: resultado === false ? 1 : 0.5,
            }}
            title="Perdida"
          >
            😢
          </button>
        </div>
      )}

      {/* Expand handle at bottom (edit mode) */}
      {isEdicion && onExpand && span < 5 && (
        <div
          style={{
            marginTop: 2,
            textAlign: "center",
            cursor: "ns-resize",
            fontSize: 10,
            color: colors.border,
            userSelect: "none",
            opacity: 0.6,
            lineHeight: 1,
          }}
          title="Arrastra para expandir"
          onPointerDown={(e) => {
            e.stopPropagation();
            const startY = e.clientY;
            const handlePointerMove = (ev: PointerEvent) => {
              const delta = ev.clientY - startY;
              if (delta > slotHeight * 0.6) {
                onExpand(1);
                document.removeEventListener("pointermove", handlePointerMove);
                document.removeEventListener("pointerup", handlePointerUp);
              }
            };
            const handlePointerUp = () => {
              document.removeEventListener("pointermove", handlePointerMove);
              document.removeEventListener("pointerup", handlePointerUp);
            };
            document.addEventListener("pointermove", handlePointerMove);
            document.addEventListener("pointerup", handlePointerUp);
          }}
        >
          ⋮
        </div>
      )}
      {isEdicion && onExpand && span > 1 && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "50%",
            transform: "translateX(-50%)",
            cursor: "ns-resize",
            fontSize: 10,
            color: colors.border,
            userSelect: "none",
            opacity: 0.6,
            lineHeight: 1,
          }}
          title="Arrastra para reducir"
          onPointerDown={(e) => {
            e.stopPropagation();
            const startY = e.clientY;
            const handlePointerMove = (ev: PointerEvent) => {
              const delta = ev.clientY - startY;
              if (delta < -slotHeight * 0.6) {
                onExpand(-1);
                document.removeEventListener("pointermove", handlePointerMove);
                document.removeEventListener("pointerup", handlePointerUp);
              }
            };
            const handlePointerUp = () => {
              document.removeEventListener("pointermove", handlePointerMove);
              document.removeEventListener("pointerup", handlePointerUp);
            };
            document.addEventListener("pointermove", handlePointerMove);
            document.addEventListener("pointerup", handlePointerUp);
          }}
        >
          ⋮
        </div>
      )}
    </div>
  );
}
