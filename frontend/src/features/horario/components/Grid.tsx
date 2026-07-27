import { useDroppable } from "@dnd-kit/core";
import type { Bloque, DiaSemana } from "../types.ts";
import type { Materia } from "../../pensum/types.ts";
import MateriaSlot from "./MateriaSlot.tsx";
import type { ModoHorario } from "../types.ts";

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

function generarSlots(unidadMinutos: number): { horaInicio: string; horaFin: string }[] {
  const slots: { horaInicio: string; horaFin: string }[] = [];
  let minutoActual = 7 * 60;
  const fin = 22 * 60;

  while (minutoActual + unidadMinutos <= fin) {
    slots.push({
      horaInicio: fmt(minutoActual),
      horaFin: fmt(minutoActual + unidadMinutos),
    });
    minutoActual += unidadMinutos;
  }
  return slots;
}

function getSpan(bloque: Bloque, unidadMinutos: number): number {
  return Math.round((aMinutos(bloque.horaFin) - aMinutos(bloque.horaInicio)) / unidadMinutos);
}

type CellInfo = { type: "start"; bloque: Bloque; span: number } | { type: "span" } | { type: "empty" };

function buildCellMap(bloques: Bloque[], unidadMinutos: number, slots: { horaInicio: string }[]): Map<string, CellInfo> {
  const map = new Map<string, CellInfo>();
  const startKeys = new Map<string, Bloque>();

  for (const b of bloques) {
    const key = `${b.dia}-${b.horaInicio}`;
    startKeys.set(key, b);
  }

  const spanned = new Set<string>();
  for (const b of bloques) {
    const span = getSpan(b, unidadMinutos);
    if (span > 1) {
      const ini = aMinutos(b.horaInicio);
      for (let i = 1; i < span; i++) {
        const m = ini + i * unidadMinutos;
        spanned.add(`${b.dia}-${fmt(m)}`);
      }
    }
  }

  for (const slot of slots) {
    for (const dia of DIAS) {
      const key = `${dia}-${slot.horaInicio}`;
      if (startKeys.has(key)) {
        const bloque = startKeys.get(key)!;
        map.set(key, { type: "start", bloque, span: getSpan(bloque, unidadMinutos) });
      } else if (spanned.has(key)) {
        map.set(key, { type: "span" });
      } else {
        map.set(key, { type: "empty" });
      }
    }
  }
  return map;
}

interface DroppableCellProps {
  dia: DiaSemana;
  horaInicio: string;
  horaFin: string;
  isOver: boolean;
}

function DroppableCell({ dia, horaInicio, horaFin, isOver }: DroppableCellProps) {
  const { setNodeRef } = useDroppable({
    id: `cell-${dia}-${horaInicio}`,
    data: { type: "cell", dia, horaInicio, horaFin },
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        border: "1px solid var(--color-border)",
        borderTop: "none",
        borderLeft: "none",
        minHeight: 52,
        background: isOver ? "var(--color-primary-muted, #dbeafe)" : "transparent",
        transition: "background 0.15s",
      }}
    />
  );
}

interface GridProps {
  bloques: Bloque[];
  materias: Materia[];
  unidadHoraMinutos: number;
  modo: ModoHorario;
  onRemoveBloque?: (codigo: string) => void;
  onExpandBloque?: (codigo: string, unidades: number) => void;
  onMarcarResultado?: (codigo: string, aprobada: boolean) => void;
  resultados?: Record<string, boolean>;
}

export default function Grid({ bloques, materias, unidadHoraMinutos, modo, onRemoveBloque, onExpandBloque, onMarcarResultado, resultados }: GridProps) {
  const slots = generarSlots(unidadHoraMinutos);
  const materiaMap = new Map(materias.map((m) => [m.codigo, m]));
  const cellMap = buildCellMap(bloques, unidadHoraMinutos, slots);

  function tieneChoque(bloque: Bloque): boolean {
    return bloques.some(
      (b) =>
        b.materiaCodigo !== bloque.materiaCodigo &&
        b.dia === bloque.dia &&
        aMinutos(b.horaInicio) < aMinutos(bloque.horaFin) &&
        aMinutos(b.horaFin) > aMinutos(bloque.horaInicio),
    );
  }

  const containerStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: `60px repeat(${DIAS.length}, 1fr)`,
    borderTop: "1px solid var(--color-border)",
    borderLeft: "1px solid var(--color-border)",
    borderRadius: "var(--radius-md)",
    overflow: "hidden",
    fontSize: "var(--font-size-sm)",
  };

  const headerCellStyle: React.CSSProperties = {
    padding: "var(--spacing-2)",
    fontWeight: 600,
    textAlign: "center",
    borderBottom: "1px solid var(--color-border)",
    borderRight: "1px solid var(--color-border)",
    background: "var(--color-surface)",
  };

  const timeCellStyle: React.CSSProperties = {
    ...headerCellStyle,
    fontWeight: 400,
    fontSize: "var(--font-size-xs)",
    color: "var(--color-text-muted)",
    whiteSpace: "nowrap",
  };

  return (
    <div style={containerStyle}>
      <div style={headerCellStyle}>Hora</div>
      {DIAS.map((dia) => (
        <div key={dia} style={headerCellStyle}>{DIAS_LABEL[dia]}</div>
      ))}

      {slots.map((slot) => (
        <Row
          key={slot.horaInicio}
          slot={slot}
          dias={DIAS}
          cellMap={cellMap}
          materiaMap={materiaMap}
          tieneChoque={tieneChoque}
          modo={modo}
          onRemoveBloque={onRemoveBloque}
          onExpandBloque={onExpandBloque}
          onMarcarResultado={onMarcarResultado}
          resultados={resultados}
          timeCellStyle={timeCellStyle}
        />
      ))}
    </div>
  );
}

interface RowProps {
  slot: { horaInicio: string; horaFin: string };
  dias: DiaSemana[];
  cellMap: Map<string, CellInfo>;
  materiaMap: Map<string, Materia>;
  tieneChoque: (b: Bloque) => boolean;
  modo: ModoHorario;
  onRemoveBloque?: (codigo: string) => void;
  onExpandBloque?: (codigo: string, unidades: number) => void;
  onMarcarResultado?: (codigo: string, aprobada: boolean) => void;
  resultados?: Record<string, boolean>;
  timeCellStyle: React.CSSProperties;
}

function Row({ slot, dias, cellMap, materiaMap, tieneChoque, modo, onRemoveBloque, onExpandBloque, onMarcarResultado, resultados, timeCellStyle }: RowProps) {
  return (
    <>
      <div style={timeCellStyle}>{slot.horaInicio}</div>
      {dias.map((dia) => {
        const key = `${dia}-${slot.horaInicio}`;
        const cell = cellMap.get(key);

        if (!cell || cell.type === "empty") {
          return (
            <DroppableCell
              key={key}
              dia={dia}
              horaInicio={slot.horaInicio}
              horaFin={slot.horaFin}
              isOver={false}
            />
          );
        }

        if (cell.type === "span") {
          return <div key={key} style={{ border: "none", borderRight: "1px solid var(--color-border)", minHeight: 52, background: "var(--color-surface-alt, #f8fafc)" }} />;
        }

        if (cell.type === "start") {
          const materia = materiaMap.get(cell.bloque.materiaCodigo);
          const conflicto = tieneChoque(cell.bloque);
          const span = cell.span;

          const slotStyle: React.CSSProperties = {
            border: "1px solid var(--color-border)",
            borderTop: "none",
            borderLeft: "none",
            minHeight: 52,
            background: "var(--color-surface)",
            position: "relative",
            ...(span > 1
              ? {
                  display: "flex",
                  alignItems: "stretch",
                }
              : {}),
          };

          return (
            <div key={key} style={slotStyle}>
              {materia && (
                <MateriaSlot
                  bloque={cell.bloque}
                  materia={materia}
                  conflicto={conflicto}
                  span={span}
                  modo={modo}
                  resultado={resultados?.[materia.codigo]}
                  onRemove={onRemoveBloque ? () => onRemoveBloque(materia.codigo) : undefined}
                  onExpand={onExpandBloque ? (u) => onExpandBloque(materia.codigo, u) : undefined}
                  onMarcar={onMarcarResultado ? (a) => onMarcarResultado(materia.codigo, a) : undefined}
                />
              )}
            </div>
          );
        }

        return null;
      })}
    </>
  );
}
