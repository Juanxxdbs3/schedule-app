import { useDraggable } from "@dnd-kit/core";
import { CheckCircle2, XCircle, Copy, Undo2 } from "lucide-react";
import type { Bloque, ModoHorario } from "../types.ts";
import type { Materia } from "../../pensum/types.ts";

interface MateriaSlotProps {
  bloque: Bloque;
  materia: Materia;
  conflicto: boolean;
  span: number;
  modo: ModoHorario;
  resultado?: 'aprobada' | 'perdida';
  onRemove?: () => void;
  onExpandDown?: () => void;
  onExpandUp?: () => void;
  onDuplicate?: () => void;
  onMarcar?: (resultado: 'aprobada' | 'perdida' | null) => void;
  onEdit?: (bloque: Bloque) => void;
}

const COLOR_BY_ESTADO: Record<string, { border: string; bg: string; text: string }> = {
  activo: { border: "#d97706", bg: "#fef3c7", text: "#92400e" },
  matriculado: { border: "#16a34a", bg: "#dcfce7", text: "#166534" },
  cursado: { border: "#9ca3af", bg: "#f3f4f6", text: "#6b7280" },
  en_espera: { border: "#2563eb", bg: "#dbeafe", text: "#1e40af" },
};

export default function MateriaSlot({ bloque, materia, conflicto, span, modo, resultado, onRemove, onExpandDown, onExpandUp, onDuplicate, onMarcar, onEdit }: MateriaSlotProps) {
  const colors = COLOR_BY_ESTADO[materia.estado] ?? COLOR_BY_ESTADO.activo;
  const isEdicion = modo === "edicion";
  const isCursado = materia.estado === "cursado";

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `placed-${bloque.id}`,
    data: { type: "placed", materia, bloque },
    disabled: !isEdicion || isCursado,
  });

  const displayName = bloque.nombrePersonalizado || materia.nombre;
  const extraLines: string[] = [];
  if (bloque.profesor) extraLines.push(bloque.profesor);
  if (bloque.salon) extraLines.push(bloque.salon);

  const tooltipParts = [displayName];
  if (bloque.profesor) tooltipParts.push(bloque.profesor);
  if (bloque.salon) tooltipParts.push(bloque.salon);
  tooltipParts.push(`${bloque.horaInicio}–${bloque.horaFin}`);
  const tooltipText = tooltipParts.join(" · ");

  function bgClass() {
    if (conflicto) return "bg-danger-bg";
    if (resultado === 'aprobada') return "bg-[#f5f3ff]";
    if (resultado === 'perdida') return "bg-[#fff7ed]";
    return "";
  }

  function borderColor() {
    if (conflicto) return "border-danger";
    if (resultado === 'aprobada') return "border-[#7c3aed]";
    if (resultado === 'perdida') return "border-[#ea580c]";
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
    touchAction: isEdicion && !isCursado ? "none" : "auto",
  };

  return (
    <div
      ref={setNodeRef}
      className={`rounded-sm text-[11px] overflow-visible select-none relative h-full flex flex-col justify-between box-border ${
        isEdicion ? "p-0.5" : "px-1.5 py-1"
      } ${isEdicion && !isCursado ? "cursor-grab" : "cursor-default"} ${bgClass()} border border-solid ${borderColor()} ${textColor()} ${
        isDragging ? "opacity-50 z-[999]" : "opacity-100 z-[1]"
      }`}
      style={draggingStyle}
      {...(isEdicion && !isCursado ? { ...listeners, ...attributes } : {})}
      title={tooltipText}
    >
      {isEdicion && onExpandUp && (
        <div
          className="absolute left-0 right-0 top-[-6px] h-3 z-10 select-none"
          style={{ touchAction: "none", cursor: "ns-resize" }}
          onPointerDown={makeDragHandler("up", onExpandUp)}
        >
          <div className="text-center text-[10px] opacity-50 leading-none" style={{ color: colors.border }}>⋮</div>
        </div>
      )}

      <div
        className="flex justify-between items-start flex-1 min-h-0"
        onClick={isEdicion && onEdit ? () => onEdit(bloque) : undefined}
      >
        <div className="min-w-0">
          <div className={`font-semibold leading-tight ${span >= 2 ? "line-clamp-2" : "truncate"}`}>{displayName}</div>
          {extraLines.length > 0 && span >= 2 && (
            <div className="text-[10px] leading-tight opacity-80">
              {extraLines.map((line, i) => (
                <div key={i} className="truncate">{line}</div>
              ))}
            </div>
          )}
          {span >= 2 && (
            <div className="text-[10px] leading-tight opacity-80">
              {bloque.horaInicio}–{bloque.horaFin}
            </div>
          )}
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
              <button type="button"
                onClick={(e) => { if (!isCursado) { e.stopPropagation(); onRemove(); } }}
                disabled={isCursado}
                className={`w-4 h-4 p-0 border-none rounded-full text-[10px] text-center leading-4 flex-shrink-0 flex items-center justify-center ${
                  isCursado ? "opacity-30 cursor-not-allowed" : "cursor-pointer"
                }`}
                style={{ background: isCursado ? "transparent" : "rgba(0,0,0,0.1)", color: isCursado ? "#999" : "#666" }}
                title={isCursado ? "Debes deshacer el resultado antes de quitar" : "Quitar del horario"}>✕</button>
            )}
          </div>
        )}
      </div>

      {modo === "curso" && resultado && (
        <div className="text-center leading-none mt-0.5">
          {resultado === 'aprobada' ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-success inline" />
          ) : (
            <XCircle className="w-3.5 h-3.5 text-danger inline" />
          )}
        </div>
      )}

      {modo === "curso" && onMarcar && (
        <div className="flex gap-1 justify-center mt-0.5 items-center">
          {resultado ? (
            <button type="button" onClick={(e) => { e.stopPropagation(); onMarcar(null); }}
              className="px-0.5 rounded-sm cursor-pointer text-sm leading-[18px] bg-transparent border border-solid border-transparent opacity-60 hover:opacity-100"
              title="Deshacer">
              <Undo2 className="w-3 h-3" />
            </button>
          ) : (
            <>
              <button type="button" onClick={(e) => { e.stopPropagation(); onMarcar('aprobada'); }}
                className={`px-0.5 rounded-sm cursor-pointer text-sm leading-[18px] ${
                  resultado === 'aprobada' ? "bg-[#f5f3ff] border border-solid border-[#7c3aed] opacity-100" : "bg-transparent border border-solid border-transparent opacity-50"
                }`}
                title="Aprobada">
                <CheckCircle2 className="w-3.5 h-3.5" style={{ color: resultado === 'aprobada' ? "#7c3aed" : "inherit" }} />
              </button>
              <button type="button" onClick={(e) => { e.stopPropagation(); onMarcar('perdida'); }}
                className={`px-0.5 rounded-sm cursor-pointer text-sm leading-[18px] ${
                  resultado === 'perdida' ? "bg-[#fff7ed] border border-solid border-[#ea580c] opacity-100" : "bg-transparent border border-solid border-transparent opacity-50"
                }`}
                title="Perdida">
                <XCircle className="w-3.5 h-3.5" style={{ color: resultado === 'perdida' ? "#ea580c" : "inherit" }} />
              </button>
            </>
          )}
        </div>
      )}

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
