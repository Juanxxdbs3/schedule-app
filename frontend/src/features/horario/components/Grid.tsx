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
  onMarcarResultado?: (codigo: string, aprobada: boolean) => void;
  resultados?: Record<string, boolean>;
}

const headClasses = "p-2 font-semibold text-center border-b border-border border-r border-border bg-surface";
const timeClasses = "p-1 font-normal text-xs text-muted text-center border-b border-border border-r border-border bg-surface";

export default function Grid({
  bloques, materias, unidadHoraMinutos: u, modo,
  onRemoveBloque, onExpandBloqueDown, onExpandBloqueUp, onDuplicateBloque,
  onMarcarResultado, resultados,
}: GridProps) {
  const isEdicion = modo === "edicion";
  const filas = generarFilasHora(u);

  const slots = filas.map((horaInicio, i) => ({
    horaInicio,
    horaFin: i < filas.length - 1 ? filas[i + 1] : horaInicio,
  }));

  const materiaMap = new Map(materias.map((m) => [m.codigo, m]));
  const startBloques = new Map<string, Bloque>();
  const spannedCells = new Set<string>();

  for (const b of bloques) {
    startBloques.set(`${b.dia}-${b.horaInicio}`, b);
    const span = getGridSpan(b.horaInicio, b.horaFin, filas);
    if (span > 1) {
      const idx = filas.indexOf(b.horaInicio);
      if (idx !== -1) {
        for (let i = 1; i < span; i++) {
          if (idx + i < filas.length) spannedCells.add(`${b.dia}-${filas[idx + i]}`);
        }
      }
    }
  }

  function getGridSpan(horaInicio: string, horaFin: string, gridFilas: string[]): number {
    const startMin = aMinutos(horaInicio);
    const endMin = aMinutos(horaFin);
    let count = 0;
    for (const f of gridFilas) {
      const t = aMinutos(f);
      if (t >= startMin && t < endMin) count++;
      else if (t >= endMin) break;
    }
    return Math.max(1, count);
  }

  function tieneChoque(bloque: Bloque): boolean {
    return bloques.some(
      (b) => b.id !== bloque.id && b.dia === bloque.dia &&
        aMinutos(b.horaInicio) < aMinutos(bloque.horaFin) && aMinutos(b.horaFin) > aMinutos(bloque.horaInicio),
    );
  }

  const items: GridItem[] = [];

  items.push({ key: "hdr-time", row: 1, col: 1, rowSpan: 1, element: <div className={headClasses}>Hora</div> });
  DIAS.forEach((dia, i) => {
    items.push({ key: `hdr-${dia}`, row: 1, col: i + 2, rowSpan: 1, element: <div className={headClasses}>{DIAS_LABEL[dia]}</div> });
  });

  slots.forEach((slot, si) => {
    const row = si + 2;
    items.push({ key: `t-${slot.horaInicio}`, row, col: 1, rowSpan: 1, element: <div className={timeClasses}>{slot.horaInicio}</div> });

    DIAS.forEach((dia, di) => {
      const col = di + 2;
      const key = `${dia}-${slot.horaInicio}`;

      if (spannedCells.has(key)) return;

      const bloque = startBloques.get(key);
      if (bloque) {
        const span = getGridSpan(bloque.horaInicio, bloque.horaFin, filas);
        const materia = materiaMap.get(bloque.materiaCodigo);
        const conflicto = tieneChoque(bloque);

        items.push({
          key: `b-${key}`,
          row, col, rowSpan: span,
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
                  onMarcar={onMarcarResultado ? (a) => onMarcarResultado(materia.codigo, a) : undefined}
                />
              )}
            </div>
          ),
        });
      } else {
        items.push({
          key: `c-${key}`, row, col, rowSpan: 1,
          element: (
            <div className="h-full border-b border-border border-r border-border">
              {isEdicion && <DroppableCell dia={dia} horaInicio={slot.horaInicio} horaFin={slot.horaFin} />}
            </div>
          ),
        });
      }
    });
  });

  const numCols = DIAS.length + 1;

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
