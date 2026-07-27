import { useDroppable } from "@dnd-kit/core";
import type { Bloque, DiaSemana, ModoHorario } from "../types.ts";
import type { Materia } from "../../pensum/types.ts";
import MateriaSlot from "./MateriaSlot.tsx";
import { generarFilasHora } from "../utils/generarFilasHora.ts";

const DIAS: DiaSemana[] = ["lunes", "martes", "miercoles", "jueves", "viernes"];

const DIAS_LABEL: Record<DiaSemana, string> = {
  lunes: "Lun", martes: "Mar", miercoles: "Mié",
  jueves: "Jue", viernes: "Vie",
  sabado: "Sáb", domingo: "Dom",
};

function aMinutos(h: string): number {
  const [hh, mm] = h.split(":").map(Number);
  return hh * 60 + mm;
}

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
  onRemoveBloque?: (bloqueId: string) => void;
  onExpandBloqueDown?: (bloqueId: string) => void;
  onExpandBloqueUp?: (bloqueId: string) => void;
  onDuplicateBloque?: (bloque: Bloque) => void;
  onEditBloque?: (bloque: Bloque) => void;
  onMarcarResultado?: (codigo: string, aprobada: boolean) => void;
  resultados?: Record<string, boolean>;
}

const headClasses = "p-2 font-semibold text-center border-b border-border border-r border-border bg-surface";
const timeClasses = "p-1 font-normal text-xs text-muted text-center border-b border-border border-r border-border bg-surface";

export default function Grid({
  bloques, materias, unidadHoraMinutos: u, modo,
  onRemoveBloque, onExpandBloqueDown, onExpandBloqueUp, onDuplicateBloque,
  onEditBloque, onMarcarResultado, resultados,
}: GridProps) {
  const isEdicion = modo === "edicion";
  const filas = generarFilasHora(u);

  const slots = filas.map((horaInicio, i) => ({
    horaInicio,
    horaFin: i < filas.length - 1 ? filas[i + 1] : horaInicio,
  }));

  const materiaMap = new Map(materias.map((m) => [m.codigo, m]));

  // Find the best row index for a given horaInicio (nearest grid slot <= horaInicio)
  function rowIndexFor(hora: string): number {
    const m = aMinutos(hora);
    // Find last slot whose time <= m
    let idx = -1;
    for (let i = 0; i < filas.length; i++) {
      if (aMinutos(filas[i]) <= m) idx = i;
      else break;
    }
    return idx;
  }

  // Count grid slots covered by the interval [horaInicio, horaFin)
  function spanFor(horaInicio: string, horaFin: string): number {
    const startM = aMinutos(horaInicio);
    const endM = aMinutos(horaFin);
    let count = 0;
    for (const f of filas) {
      const t = aMinutos(f);
      if (t >= startM && t < endM) count++;
      else if (t >= endM) break;
    }
    return Math.max(1, count);
  }

  function tieneChoque(bloque: Bloque): boolean {
    return bloques.some(
      (b) => b.id !== bloque.id && b.dia === bloque.dia &&
        aMinutos(b.horaInicio) < aMinutos(bloque.horaFin) && aMinutos(b.horaFin) > aMinutos(bloque.horaInicio),
    );
  }

  // Build occupied cells and compute block placements
  const occupiedCells = new Set<string>();

  interface BlockPlacement {
    bloque: Bloque;
    rowIdx: number;
    span: number;
  }
  const placements: BlockPlacement[] = [];

  for (const b of bloques) {
    const rowIdx = rowIndexFor(b.horaInicio);
    if (rowIdx === -1) continue;
    const span = spanFor(b.horaInicio, b.horaFin);
    placements.push({ bloque: b, rowIdx, span });
    for (let i = 0; i < span; i++) {
      if (rowIdx + i < filas.length) {
        occupiedCells.add(`${b.dia}-${filas[rowIdx + i]}`);
      }
    }
  }

  const items: GridItem[] = [];

  // Header row
  items.push({ key: "hdr-time", row: 1, col: 1, rowSpan: 1, element: <div className={headClasses}>Hora</div> });
  DIAS.forEach((dia, i) => {
    items.push({ key: `hdr-${dia}`, row: 1, col: i + 2, rowSpan: 1, element: <div className={headClasses}>{DIAS_LABEL[dia]}</div> });
  });

  // Render time labels and droppable cells for each slot
  slots.forEach((slot, si) => {
    const row = si + 2;
    items.push({ key: `t-${slot.horaInicio}`, row, col: 1, rowSpan: 1, element: <div className={timeClasses}>{slot.horaInicio}</div> });

    DIAS.forEach((dia, di) => {
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

  // Render blocks AFTER slots so they appear on top in z-order
  for (const { bloque, rowIdx, span } of placements) {
    const materia = materiaMap.get(bloque.materiaCodigo);
    const conflicto = tieneChoque(bloque);

    items.push({
      key: `b-${bloque.id}`,
      row: rowIdx + 2,
      col: DIAS.indexOf(bloque.dia) + 2,
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
              onDuplicate={onDuplicateBloque ? () => onDuplicateBloque(bloque) : undefined}
              onEdit={onEditBloque ? () => onEditBloque(bloque) : undefined}
              onMarcar={onMarcarResultado ? (a) => onMarcarResultado(materia.codigo, a) : undefined}
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
        gridTemplateColumns: `60px repeat(${DIAS.length}, 1fr)`,
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
