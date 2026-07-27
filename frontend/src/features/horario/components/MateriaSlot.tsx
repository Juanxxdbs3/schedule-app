import { useDraggable } from "@dnd-kit/core";
import { CheckCircle2, XCircle, Copy } from "lucide-react";
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
  onDuplicate?: () => void;
  onMarcar?: (aprobada: boolean) => void;
}

const COLOR_BY_ESTADO: Record<string, { border: string; bg: string; text: string }> = {
  activo: { border: "#d97706", bg: "#fef3c7", text: "#92400e" },
  matriculado: { border: "#16a34a", bg: "#dcfce7", text: "#166534" },
  cursado: { border: "#9ca3af", bg: "#f3f4f6", text: "#6b7280" },
  en_espera: { border: "#2563eb", bg: "#dbeafe", text: "#1e40af" },
};

export default function MateriaSlot({ bloque, materia, conflicto, span, modo, resultado, onRemove, onExpandDown, onExpandUp, onDuplicate, onMarcar }: MateriaSlotProps) {
  const colors = COLOR_BY_ESTADO[materia.estado] ?? COLOR_BY_ESTADO.activo;
  const isEdicion = modo === "edicion";

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `placed-${bloque.id}`,
    data: { type: "placed", materia, bloque },
    disabled: !isEdicion,
  });

  function bgClass() {
    if (conflicto) return "bg-danger-bg";
    if (resultado === true) return "bg-[#f5f3ff]";
    if (resultado === false) return "bg-[#fff7ed]";
    return "";
  }

  function borderColor() {
    if (conflicto) return "border-danger";
    if (resultado === true) return "border-[#7c3aed]";
    if (resultado === false) return "border-[#ea580c]";
    return `border-[${colors.border}]`;
  }

  function textColor() {
    if (conflicto) return "text-danger";
    return `text-[${colors.text}]`;
  }

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

  const draggingStyle: React.CSSProperties = {
    transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
    touchAction: isEdicion ? "none" : "auto",
  };

  return (
    <div
      ref={setNodeRef}
      className={`rounded-sm text-[11px] overflow-visible select-none relative h-full flex flex-col justify-between box-border ${
        isEdicion ? "p-0.5" : "px-1.5 py-1"
      } ${isEdicion ? "cursor-grab" : "cursor-default"} ${bgClass()} border border-solid ${borderColor()} ${textColor()} ${
        isDragging ? "opacity-50 z-[999]" : "opacity-100 z-[1]"
      }`}
      style={draggingStyle}
      {...(isEdicion ? { ...listeners, ...attributes } : {})}
      title={materia.nombre}
    >
      {/* Top expand handle */}
      {isEdicion && onExpandUp && (
        <div
          className="absolute left-0 right-0 top-[-6px] h-3 z-10 select-none"
          style={{ touchAction: "none", cursor: "ns-resize" }}
          onPointerDown={makeDragHandler("up", onExpandUp)}
        >
          <div className="text-center text-[10px] opacity-50 leading-none" style={{ color: colors.border }}>⋮</div>
        </div>
      )}

      <div className="flex justify-between items-start">
        <div>
          <div className="font-semibold leading-tight">{materia.nombre}</div>
          <div className="text-[10px] leading-tight opacity-80">
            {bloque.horaInicio}–{bloque.horaFin}
          </div>
        </div>
        {isEdicion && (
          <div className="flex gap-0.5 items-start flex-shrink-0 ml-0.5">
            {onDuplicate && (
              <button type="button" onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
                className="w-4 h-4 p-0 border-none rounded-full cursor-pointer text-[10px] text-center leading-4 flex items-center justify-center"
                style={{ background: "rgba(0,0,0,0.08)", color: "#666" }}
                title="Duplicar bloque">
                <Copy className="w-2.5 h-2.5" />
              </button>
            )}
            {onRemove && (
              <button type="button" onClick={(e) => { e.stopPropagation(); onRemove(); }}
                className="w-4 h-4 p-0 border-none rounded-full cursor-pointer text-[10px] text-center leading-4 flex-shrink-0"
                style={{ background: "rgba(0,0,0,0.1)", color: "#666" }}
                title="Quitar del horario">✕</button>
            )}
          </div>
        )}
      </div>

      {/* Result */}
      {modo === "curso" && resultado !== undefined && (
        <div className="text-center leading-none mt-0.5">
          {resultado ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-success inline" />
          ) : (
            <XCircle className="w-3.5 h-3.5 text-danger inline" />
          )}
        </div>
      )}

      {/* Icon buttons */}
      {modo === "curso" && onMarcar && (
        <div className="flex gap-1 justify-center mt-0.5">
          <button type="button" onClick={(e) => { e.stopPropagation(); onMarcar(true); }}
            className={`px-0.5 rounded-sm cursor-pointer text-sm leading-[18px] ${
              resultado === true ? "bg-[#f5f3ff] border border-solid border-[#7c3aed] opacity-100" : "bg-transparent border border-solid border-transparent opacity-50"
            }`}
            title="Aprobada">
            <CheckCircle2 className="w-3.5 h-3.5" style={{ color: resultado === true ? "#7c3aed" : "inherit" }} />
          </button>
          <button type="button" onClick={(e) => { e.stopPropagation(); onMarcar(false); }}
            className={`px-0.5 rounded-sm cursor-pointer text-sm leading-[18px] ${
              resultado === false ? "bg-[#fff7ed] border border-solid border-[#ea580c] opacity-100" : "bg-transparent border border-solid border-transparent opacity-50"
            }`}
            title="Perdida">
            <XCircle className="w-3.5 h-3.5" style={{ color: resultado === false ? "#ea580c" : "inherit" }} />
          </button>
        </div>
      )}

      {/* Bottom expand handle */}
      {isEdicion && onExpandDown && span < 5 && (
        <div
          className="absolute left-0 right-0 bottom-[-6px] h-3 z-10 select-none"
          style={{ touchAction: "none", cursor: "ns-resize" }}
          onPointerDown={makeDragHandler("down", onExpandDown)}
        >
          <div className="text-center text-[10px] opacity-50 leading-none" style={{ color: colors.border }}>⋮</div>
        </div>
      )}
    </div>
  );
}
