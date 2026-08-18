import { ChevronDown, ChevronUp } from "lucide-react";
import { useDroppable } from "@dnd-kit/core";
import type { Bloque, DiaSemana, ModoHorario } from "../types.ts";
import type { Materia } from "../../pensum/types.ts";
import MateriaSlot from "./MateriaSlot.tsx";
import { generarFilasHora } from "../utils/generarFilasHora.ts";
import { DIAS_LABEL, aMinutos, rowIndexFor, spanFor } from "../utils/gridMath.ts";

function DroppableCell({ dia, horaInicio, horaFin }: { dia: DiaSemana; horaInicio: string; horaFin: string }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `cell-${dia}-${horaInicio}`,
    data: { type: "cell", dia, horaInicio, horaFin },
  });

  return (
    <div ref={setNodeRef} className={`h-full transition-colors duration-150 ${isOver ? "bg-primary-muted" : "bg-transparent"}`} />
  );
}

interface GridItem {
  key: string;
  row: number;
  col: number;
  rowSpan: number;
  element: React.ReactNode;
}

interface GridProps {
  bloques: Bloque[];
  materias: Materia[];
  unidadHoraMinutos: number;
  modo: ModoHorario;
  dias: DiaSemana[];
  domingoVisible: boolean;
  onToggleDomingo: () => void;
  onRemoveBloque?: (bloqueId: string) => void;
  onExpandBloqueDown?: (bloqueId: string) => void;
  onExpandBloqueUp?: (bloqueId: string) => void;
  onShrinkBloqueTop?: (bloqueId: string) => void;
  onShrinkBloqueBottom?: (bloqueId: string) => void;
  onDuplicateBloque?: (bloque: Bloque) => void;
  onEditBloque?: (bloque: Bloque) => void;
  onMarcarResultado?: (codigo: string, resultado: 'aprobada' | 'perdida' | null) => void;
  resultados?: Record<string, 'aprobada' | 'perdida'>;
}

const headClasses = "p-2 font-semibold text-center border-b border-border border-r border-border bg-surface";
const timeClasses = "p-1 font-normal text-xs text-muted text-center border-b border-border border-r border-border bg-surface";

export default function Grid({
  bloques, materias, unidadHoraMinutos: u, modo, dias, domingoVisible, onToggleDomingo,
  onRemoveBloque, onExpandBloqueDown, onExpandBloqueUp, onShrinkBloqueTop, onShrinkBloqueBottom,
  onDuplicateBloque, onEditBloque, onMarcarResultado, resultados,
}: GridProps) {
  const isEdicion = modo === "edicion";
  const filas = generarFilasHora(u);

  const slots = filas.map((horaInicio, i) => ({
    horaInicio,
    horaFin: i < filas.length - 1 ? filas[i + 1] : horaInicio,
  }));

  const materiaMap = new Map(materias.map((m) => [m.codigo, m]));

  // Build the active set — if domingo is collapsed, exclude it
  const diasEfectivos = domingoVisible ? dias : dias.filter((d) => d !== "domingo");

  function tieneChoque(bloque: Bloque): boolean {
    return bloques.some(
      (b) => b.id !== bloque.id && b.dia === bloque.dia &&
        aMinutos(b.horaInicio) < aMinutos(bloque.horaFin) && aMinutos(b.horaFin) > aMinutos(bloque.horaInicio),
    );
  }

  const occupiedCells = new Set<string>();

  interface BlockPlacement {
    bloque: Bloque;
    rowIdx: number;
    span: number;
  }
  const placements: BlockPlacement[] = [];

  for (const b of bloques) {
    if (b.dia === "domingo" && !domingoVisible) continue;
    const rowIdx = rowIndexFor(b.horaInicio, filas);
    if (rowIdx === -1) continue;
    const span = spanFor(b.horaInicio, b.horaFin, filas);
    placements.push({ bloque: b, rowIdx, span });
    for (let i = 0; i < span; i++) {
      if (rowIdx + i < filas.length) {
        occupiedCells.add(`${b.dia}-${filas[rowIdx + i]}`);
      }
    }
  }

  const items: GridItem[] = [];

  items.push({ key: "hdr-time", row: 1, col: 1, rowSpan: 1, element: <div className={headClasses}>Hora</div> });
  diasEfectivos.forEach((dia, i) => {
    const isDomingo = dia === "domingo";
    items.push({
      key: `hdr-${dia}`, row: 1, col: i + 2, rowSpan: 1,
      element: (
        <div className={`${headClasses} flex items-center justify-center gap-1`}>
          <span>{DIAS_LABEL[dia]}</span>
          {isDomingo && (
            <button type="button" onClick={onToggleDomingo}
              className="p-0 border-none bg-transparent cursor-pointer text-muted hover:text-text"
              title={domingoVisible ? "Ocultar domingo" : "Mostrar domingo"}>
              {domingoVisible ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}
        </div>
      ),
    });
  });

  slots.forEach((slot, si) => {
    const row = si + 2;
    items.push({ key: `t-${slot.horaInicio}`, row, col: 1, rowSpan: 1, element: <div className={timeClasses}>{slot.horaInicio}</div> });

    diasEfectivos.forEach((dia, di) => {
      const col = di + 2;
      const key = `${dia}-${slot.horaInicio}`;

      if (occupiedCells.has(key)) return;

      items.push({
        key: `c-${key}`, row, col, rowSpan: 1,
        element: (
          <div className="h-full border-b border-border border-r border-border">
            {isEdicion && <DroppableCell dia={dia} horaInicio={slot.horaInicio} horaFin={slot.horaFin} />}
          </div>
        ),
      });
    });
  });

  for (const { bloque, rowIdx, span } of placements) {
    const materia = materiaMap.get(bloque.materiaCodigo);
    const conflicto = tieneChoque(bloque);

    items.push({
      key: `b-${bloque.id}`,
      row: rowIdx + 2,
      col: diasEfectivos.indexOf(bloque.dia) + 2,
      rowSpan: span,
      element: (
        <div className="h-full border-b border-border border-r border-border bg-surface relative">
            {materia && (
            <MateriaSlot
              bloque={bloque} materia={materia} conflicto={conflicto} span={span} modo={modo}
              resultado={resultados?.[materia.codigo]}
              onRemove={onRemoveBloque ? () => onRemoveBloque(bloque.id) : undefined}
              onExpandDown={onExpandBloqueDown ? () => onExpandBloqueDown(bloque.id) : undefined}
              onExpandUp={onExpandBloqueUp ? () => onExpandBloqueUp(bloque.id) : undefined}
              onShrinkTop={onShrinkBloqueTop ? () => onShrinkBloqueTop(bloque.id) : undefined}
              onShrinkBottom={onShrinkBloqueBottom ? () => onShrinkBloqueBottom(bloque.id) : undefined}
              onDuplicate={onDuplicateBloque ? () => onDuplicateBloque(bloque) : undefined}
              onEdit={onEditBloque ? () => onEditBloque(bloque) : undefined}
              onMarcar={onMarcarResultado ? (r) => onMarcarResultado(materia.codigo, r) : undefined}
            />
          )}
        </div>
      ),
    });
  }

  return (
    <div
      className="grid border-t border-border border-l border-border rounded-md overflow-hidden text-sm"
      style={{
        gridTemplateColumns: `60px repeat(${diasEfectivos.length}, minmax(140px, 1fr))`,
        gridAutoRows: 52,
      }}
    >
      {items.map((it) => (
        <div key={it.key} style={{ gridRow: `${it.row} / span ${it.rowSpan}`, gridColumn: it.col }}>
          {it.element}
        </div>
      ))}
    </div>
  );
}
