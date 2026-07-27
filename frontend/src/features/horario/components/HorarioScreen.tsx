import { useState, useMemo } from "react";
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import type { Horario, Bloque, DiaSemana } from "../types.ts";
import type { Materia } from "../../pensum/types.ts";
import type { Pensum } from "../../pensum/types.ts";
import type { ModoHorario } from "../types.ts";
import { useHorarioStore } from "../store/horarioStore.ts";
import { filtrarMaterias } from "../../../shared/utils/filterMaterias.ts";
import Grid from "./Grid.tsx";
import ContadorCreditos from "./ContadorCreditos.tsx";
import DropZone from "./DropZone.tsx";
import MateriaBlock from "../../pensum/components/MateriaBlock.tsx";

interface HorarioScreenProps {
  modo: ModoHorario;
  horario: Horario;
  pensum: Pensum;
  onModoChange: (modo: ModoHorario) => void;
}

export default function HorarioScreen({ modo, horario, pensum, onModoChange }: HorarioScreenProps) {
  const addBloqueLocal = useHorarioStore((s) => s.addBloqueLocal);
  const removeBloqueLocal = useHorarioStore((s) => s.removeBloqueLocal);
  const moveBloqueLocal = useHorarioStore((s) => s.moveBloqueLocal);
  const expandBloqueDown = useHorarioStore((s) => s.expandBloqueDown);
  const expandBloqueUp = useHorarioStore((s) => s.expandBloqueUp);
  const marcarResultado = useHorarioStore((s) => s.marcarResultado);
  const storeHorario = useHorarioStore((s) => s.horario);

  function aMinutos(h: string): number {
    const [hh, mm] = h.split(":").map(Number);
    return hh * 60 + mm;
  }

  function fmt(m: number): string {
    return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
  }

  const [activeMateria, setActiveMateria] = useState<Materia | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resultados, setResultados] = useState<Record<string, boolean>>({});
  const [filtroNombre, setFiltroNombre] = useState("");
  const [filtroSemestre, setFiltroSemestre] = useState<number | "">("");
  const [filtroCreditos, setFiltroCreditos] = useState<number | "">("");
  const [localActivos, setLocalActivos] = useState<Set<string>>(new Set());
  const todasResultadas = bloques.every((b) => resultados[b.materiaCodigo] !== undefined);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const bloques = storeHorario?.bloques ?? [];
  const materiasTodas = pensum.materias;
  const codigosEnHorario = new Set(bloques.map((b) => b.materiaCodigo));

  const materiasEnPool = useMemo(() => {
    const disponibles = materiasTodas
      .filter((m) => {
        const estadoEfectivo = localActivos.has(m.codigo) ? "activo" : m.estado;
        if (estadoEfectivo !== "activo") return false;
        if (codigosEnHorario.has(m.codigo)) return false;
        return true;
      })
      .map((m) => ({
        ...m,
        estado: (localActivos.has(m.codigo) ? "activo" : m.estado) as typeof m.estado,
      }));
    if (!filtroNombre && filtroSemestre === "" && filtroCreditos === "") return disponibles;
    return filtrarMaterias(disponibles, filtroNombre, filtroSemestre, filtroCreditos);
  }, [materiasTodas, codigosEnHorario, localActivos, filtroNombre, filtroSemestre, filtroCreditos]);

  function handleDragStart(event: DragStartEvent) {
    const data = event.active.data.current;
    if (data?.type === "materia") setActiveMateria(data.materia as Materia);
    if (data?.type === "placed") setActiveMateria(data.materia as Materia);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveMateria(null);
    setError(null);
    const { active, over } = event;
    if (!over) return;
    const ad = active.data.current;
    const od = over.data.current;

    if (ad?.type === "materia" && od?.type === "cell") {
      const materia = ad.materia as Materia;
      const bloque: Bloque = { materiaCodigo: materia.codigo, dia: od.dia, horaInicio: od.horaInicio, horaFin: od.horaFin };
      const result = addBloqueLocal(bloque, materiasTodas);
      if (result.ok) setLocalActivos((p) => { const n = new Set(p); n.delete(materia.codigo); return n; });
      if (!result.ok) setError(result.error);
    }

    if (ad?.type === "placed" && od?.type === "cell") {
      const oldBloque = ad.bloque as Bloque;
      const oldDuration = aMinutos(oldBloque.horaFin) - aMinutos(oldBloque.horaInicio);
      const newBloque: Bloque = {
        ...oldBloque,
        dia: od.dia as DiaSemana,
        horaInicio: od.horaInicio as string,
        horaFin: fmt(aMinutos(od.horaInicio as string) + oldDuration),
      };
      const result = moveBloqueLocal(newBloque, materiasTodas);
      if (!result.ok) setError(result.error);
    }

    if (ad?.type === "placed" && od?.type === "pool") {
      const materia = ad.materia as Materia;
      removeBloqueLocal(materia.codigo);
      setLocalActivos((p) => new Set(p).add(materia.codigo));
    }
  }

  function handleRemoveBloque(codigo: string) {
    removeBloqueLocal(codigo);
    setLocalActivos((p) => new Set(p).add(codigo));
  }

  function handleExpandDown(codigo: string) {
    const r = expandBloqueDown(codigo, materiasTodas);
    if (!r.ok && r.error) setError(r.error);
  }

  function handleExpandUp(codigo: string) {
    const r = expandBloqueUp(codigo, materiasTodas);
    if (!r.ok && r.error) setError(r.error);
  }

  async function handleMarcarResultado(codigo: string, aprobada: boolean) {
    setResultados((prev) => ({ ...prev, [codigo]: aprobada }));
    try { await marcarResultado(codigo, aprobada); } catch {
      setResultados((prev) => { const n = { ...prev }; delete n[codigo]; return n; });
      setError(`Error al marcar ${codigo}`);
    }
  }

  const leyenda = [
    { emoji: "😊", label: "Aprobada", color: "#7c3aed" },
    { emoji: "😢", label: "Perdida", color: "#ea580c" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-4)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--spacing-2)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-3)" }}>
          <span style={{
            padding: "2px 8px", borderRadius: "var(--radius-sm)", fontSize: "var(--font-size-xs)", fontWeight: 600,
            background: modo === "edicion" ? "#dbeafe" : modo === "curso" ? "#dcfce7" : "#f3f4f6",
            color: modo === "edicion" ? "#1e40af" : modo === "curso" ? "#166534" : "#6b7280",
          }}>
            {modo === "edicion" ? "Modo edición" : modo === "curso" ? "En curso" : "Finalizado"}
          </span>
          <ContadorCreditos bloques={bloques} materias={materiasTodas} maxCreditos={horario.maxCreditos} />
        </div>

        {modo === "curso" && (
          <div style={{ display: "flex", gap: "var(--spacing-2)", fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>
            {leyenda.map(({ emoji, label, color }) => (
              <span key={label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: 14 }}>{emoji}</span>
                <span style={{ color }}>{label}</span>
              </span>
            ))}
          </div>
        )}

        {modo === "curso" && (
          <button type="button" onClick={() => onModoChange("finalizado")}
            disabled={!todasResultadas}
            style={{
              padding: "0.4rem 1rem", background: todasResultadas ? "var(--color-primary)" : "var(--color-muted-block)",
              color: "#fff", border: "none", borderRadius: "var(--radius-md)",
              cursor: todasResultadas ? "pointer" : "not-allowed",
              fontSize: "var(--font-size-sm)", opacity: todasResultadas ? 1 : 0.6,
            }}
          >Finalizar semestre</button>
        )}
      </div>

      {error && (
        <div style={{ padding: "var(--spacing-2) var(--spacing-3)", background: "#fef2f2", border: "1px solid #ef4444", borderRadius: "var(--radius-md)", color: "#ef4444", fontSize: "var(--font-size-sm)" }}>
          {error}
        </div>
      )}

      {modo === "edicion" ? (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "var(--spacing-4)", alignItems: "start" }}>
            <Grid
              bloques={bloques} materias={materiasTodas} unidadHoraMinutos={horario.unidadHoraMinutos} modo={modo}
              onRemoveBloque={handleRemoveBloque} onExpandBloqueDown={handleExpandDown} onExpandBloqueUp={handleExpandUp}
            />
            <div style={{ background: "var(--color-surface)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", padding: "var(--spacing-3)", position: "sticky", top: "var(--spacing-3)" }}>
              <h3 style={{ fontSize: "var(--font-size-sm)", marginBottom: "var(--spacing-2)" }}>Materias ({materiasEnPool.length})</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-1)", marginBottom: "var(--spacing-2)" }}>
                <input type="text" placeholder="Buscar..." value={filtroNombre} onChange={(e) => setFiltroNombre(e.target.value)}
                  style={{ padding: "4px 8px", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", fontSize: "var(--font-size-xs)", background: "var(--color-surface)", color: "var(--color-text)" }} />
                <div style={{ display: "flex", gap: "var(--spacing-1)" }}>
                  <select value={filtroSemestre} onChange={(e) => setFiltroSemestre(e.target.value ? Number(e.target.value) : "")}
                    style={{ padding: "4px 8px", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", fontSize: "var(--font-size-xs)", background: "var(--color-surface)", color: "var(--color-text)", flex: 1 }}>
                    <option value="">Semestre</option>
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <input type="number" placeholder="Créd. máx" value={filtroCreditos} onChange={(e) => setFiltroCreditos(e.target.value ? Number(e.target.value) : "")}
                    style={{ padding: "4px 8px", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", fontSize: "var(--font-size-xs)", background: "var(--color-surface)", color: "var(--color-text)", width: 80 }} />
                </div>
              </div>
              {materiasEnPool.length === 0 ? (
                <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)", textAlign: "center", padding: "var(--spacing-3)" }}>No hay materias disponibles</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-2)", maxHeight: "calc(100vh - 400px)", overflowY: "auto" }}>
                  {materiasEnPool.map((m) => <div key={m.codigo} style={{ fontSize: "var(--font-size-sm)" }}><MateriaBlock materia={m} /></div>)}
                </div>
              )}
              <DropZone id="pool-drop" />
            </div>
          </div>
          <DragOverlay>
            {activeMateria ? <div style={{ transform: "rotate(3deg)", opacity: 0.9 }}><MateriaBlock materia={activeMateria} /></div> : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "var(--spacing-4)" }}>
          {bloques.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "var(--color-text-muted)" }}>No hay materias en el horario</div>
          ) : (
            <Grid
              bloques={bloques} materias={materiasTodas} unidadHoraMinutos={horario.unidadHoraMinutos} modo={modo}
              onMarcarResultado={modo === "curso" ? handleMarcarResultado : undefined}
              resultados={resultados}
            />
          )}
        </div>
      )}
    </div>
  );
}
