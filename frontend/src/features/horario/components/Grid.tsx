import { useDroppable } from "@dnd-kit/core";
import type { Bloque, DiaSemana } from "../types.ts";
import type { Materia } from "../../pensum/types.ts";
import MateriaSlot from "./MateriaSlot.tsx";

const DIAS: DiaSemana[] = ["lunes", "martes", "miercoles", "jueves", "viernes"];

const DIAS_LABEL: Record<DiaSemana, string> = {
  lunes: "Lun",
  martes: "Mar",
  miercoles: "Mié",
  jueves: "Jue",
  viernes: "Vie",
  sabado: "Sáb",
  domingo: "Dom",
};

function generarSlots(unidadMinutos: number): { horaInicio: string; horaFin: string }[] {
  const slots: { horaInicio: string; horaFin: string }[] = [];
  let minutoActual = 7 * 60;
  const fin = 21 * 60;

  while (minutoActual + unidadMinutos <= fin) {
    const inicioH = Math.floor(minutoActual / 60);
    const inicioM = minutoActual % 60;
    const finMinutos = minutoActual + unidadMinutos;
    const finH = Math.floor(finMinutos / 60);
    const finM = finMinutos % 60;

    const fmt = (h: number, m: number) =>
      `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

    slots.push({
      horaInicio: fmt(inicioH, inicioM),
      horaFin: fmt(finH, finM),
    });

    minutoActual += unidadMinutos;
  }

  return slots;
}

interface GridCellProps {
  dia: DiaSemana;
  horaInicio: string;
  horaFin: string;
  bloque: Bloque | undefined;
  materia: Materia | undefined;
  conflicto: boolean;
  onClickMateria?: (codigo: string) => void;
}

function GridCell({ dia, horaInicio, horaFin, bloque, materia, conflicto, onClickMateria }: GridCellProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `cell-${dia}-${horaInicio}`,
    data: { type: "cell", dia, horaInicio, horaFin },
  });

  const style: React.CSSProperties = {
    border: `1px solid var(--color-border)`,
    borderTop: "none",
    borderLeft: "none",
    minHeight: 52,
    padding: 2,
    background: isOver
      ? "var(--color-primary-muted, #dbeafe)"
      : bloque
        ? "var(--color-surface)"
        : "transparent",
    transition: "background 0.15s",
    position: "relative",
  };

  return (
    <div ref={setNodeRef} style={style}>
      {bloque && materia && (
        <MateriaSlot
          bloque={bloque}
          materia={materia}
          conflicto={conflicto}
          onClick={onClickMateria ? () => onClickMateria(materia.codigo) : undefined}
        />
      )}
    </div>
  );
}

interface GridProps {
  bloques: Bloque[];
  materias: Materia[];
  unidadHoraMinutos: number;
  onRemoveBloque?: (codigo: string) => void;
}

export default function Grid({ bloques, materias, unidadHoraMinutos, onRemoveBloque }: GridProps) {
  const slots = generarSlots(unidadHoraMinutos);

  const materiaMap = new Map<string, Materia>();
  for (const m of materias) materiaMap.set(m.codigo, m);

  const bloqueMap = new Map<string, Bloque>();
  for (const b of bloques) bloqueMap.set(b.materiaCodigo, b);

  function tieneChoque(bloque: Bloque): boolean {
    return bloques.some(
      (b) =>
        b.materiaCodigo !== bloque.materiaCodigo &&
        b.dia === bloque.dia &&
        b.horaInicio < bloque.horaFin &&
        b.horaFin > bloque.horaInicio,
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
        <div key={dia} style={headerCellStyle}>
          {DIAS_LABEL[dia]}
        </div>
      ))}

      {slots.map((slot) => (
        <CellRow
          key={slot.horaInicio}
          slot={slot}
          dias={DIAS}
          bloqueMap={bloqueMap}
          materiaMap={materiaMap}
          tieneChoque={tieneChoque}
          onRemoveBloque={onRemoveBloque}
          timeCellStyle={timeCellStyle}
        />
      ))}
    </div>
  );
}

interface CellRowProps {
  slot: { horaInicio: string; horaFin: string };
  dias: DiaSemana[];
  bloqueMap: Map<string, Bloque>;
  materiaMap: Map<string, Materia>;
  tieneChoque: (b: Bloque) => boolean;
  onRemoveBloque?: (codigo: string) => void;
  timeCellStyle: React.CSSProperties;
}

function CellRow({ slot, dias, bloqueMap, materiaMap, tieneChoque, onRemoveBloque, timeCellStyle }: CellRowProps) {
  return (
    <>
      <div style={timeCellStyle}>
        {slot.horaInicio}
      </div>
      {dias.map((dia) => {
        const bloque = bloquesEnSlot(bloqueMap, dia, slot.horaInicio);
        const materia = bloque ? materiaMap.get(bloque.materiaCodigo) : undefined;
        return (
          <GridCell
            key={`${dia}-${slot.horaInicio}`}
            dia={dia}
            horaInicio={slot.horaInicio}
            horaFin={slot.horaFin}
            bloque={bloque}
            materia={materia}
            conflicto={bloque ? tieneChoque(bloque) : false}
            onClickMateria={onRemoveBloque}
          />
        );
      })}
    </>
  );
}

function bloquesEnSlot(bloqueMap: Map<string, Bloque>, dia: DiaSemana, horaInicio: string): Bloque | undefined {
  for (const bloque of bloqueMap.values()) {
    if (bloque.dia === dia && bloque.horaInicio === horaInicio) {
      return bloque;
    }
  }
  return undefined;
}
