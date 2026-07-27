import { useDroppable } from "@dnd-kit/core";
import type { Bloque, DiaSemana, ModoHorario } from "../types.ts";
import type { Materia } from "../../pensum/types.ts";
import MateriaSlot from "./MateriaSlot.tsx";

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

function fmt(m: number): string {
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

function getSpan(bloque: Bloque, u: number): number {
  return Math.round((aMinutos(bloque.horaFin) - aMinutos(bloque.horaInicio)) / u);
}

function generarSlots(u: number, desde: number, hasta: number): { horaInicio: string; horaFin: string }[] {
  const s: { horaInicio: string; horaFin: string }[] = [];
  let m = desde;
  while (m + u <= hasta) { s.push({ horaInicio: fmt(m), horaFin: fmt(m + u) }); m += u; }
  return s;
}

function calcularUltimoSlot(bloques: Bloque[], u: number): number {
  let ultimo = 7 * 60;
  for (const b of bloques) { const fin = aMinutos(b.horaFin); if (fin > ultimo) ultimo = fin; }
  return Math.min(ultimo + u, 22 * 60);
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
  onRemoveBloque?: (codigo: string) => void;
  onExpandBloqueDown?: (codigo: string) => void;
  onExpandBloqueUp?: (codigo: string) => void;
  onMarcarResultado?: (codigo: string, aprobada: boolean) => void;
  resultados?: Record<string, boolean>;
}

const headClasses = "p-2 font-semibold text-center border-b border-border border-r border-border bg-surface";
const timeClasses = "p-1 font-normal text-xs text-muted text-center border-b border-border border-r border-border bg-surface";

export default function Grid({
  bloques, materias, unidadHoraMinutos: u, modo,
  onRemoveBloque, onExpandBloqueDown, onExpandBloqueUp,
  onMarcarResultado, resultados,
}: GridProps) {
  const isEdicion = modo === "edicion";
  const desde = 7 * 60;
  const hasta = isEdicion ? 22 * 60 : calcularUltimoSlot(bloques, u);
  const slots = generarSlots(u, desde, hasta);

  const materiaMap = new Map(materias.map((m) => [m.codigo, m]));
  const startBloques = new Map<string, Bloque>();
  const spannedCells = new Set<string>();

  for (const b of bloques) {
    startBloques.set(`${b.dia}-${b.horaInicio}`, b);
    const span = getSpan(b, u);
    if (span > 1) {
      const ini = aMinutos(b.horaInicio);
      for (let i = 1; i < span; i++) spannedCells.add(`${b.dia}-${fmt(ini + i * u)}`);
    }
  }

  function tieneChoque(bloque: Bloque): boolean {
    return bloques.some(
      (b) => b.materiaCodigo !== bloque.materiaCodigo && b.dia === bloque.dia &&
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
        const span = getSpan(bloque, u);
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
                  onRemove={onRemoveBloque ? () => onRemoveBloque(materia.codigo) : undefined}
                  onExpandDown={onExpandBloqueDown ? () => onExpandBloqueDown(materia.codigo) : undefined}
                  onExpandUp={onExpandBloqueUp ? () => onExpandBloqueUp(materia.codigo) : undefined}
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
