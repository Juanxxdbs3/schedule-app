import { useState, useCallback } from "react";
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import type { Horario, Bloque } from "../types.ts";
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
  const expandBloqueLocal = useHorarioStore((s) => s.expandBloqueLocal);
  const marcarResultado = useHorarioStore((s) => s.marcarResultado);
  const storeHorario = useHorarioStore((s) => s.horario);

  const [activeMateria, setActiveMateria] = useState<Materia | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resultados, setResultados] = useState<Record<string, boolean>>({});
  const [filtroNombre, setFiltroNombre] = useState("");
  const [filtroSemestre, setFiltroSemestre] = useState<number | "">("");
  const [filtroCreditos, setFiltroCreditos] = useState<number | "">("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const bloques = storeHorario?.bloques ?? [];
  const materiasTodas = pensum.materias;
  const materiasActivas = pensum.materias.filter((m) => m.estado === "activo");
  const codigosEnHorario = new Set(bloques.map((b) => b.materiaCodigo));

  // Pool: only active materias not in horario, with filters
  const materiasEnPool = useCallback(() => {
    const disponibles = materiasActivas.filter((m) => !codigosEnHorario.has(m.codigo));
    if (!filtroNombre && filtroSemestre === "" && filtroCreditos === "") return disponibles;
    return filtrarMaterias(disponibles, filtroNombre, filtroSemestre, filtroCreditos);
  }, [materiasActivas, codigosEnHorario, filtroNombre, filtroSemestre, filtroCreditos])();

  function handleDragStart(event: DragStartEvent) {
    const data = event.active.data.current;
    if (data?.type === "materia") {
      setActiveMateria(data.materia as Materia);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveMateria(null);
    setError(null);
    const { active, over } = event;
    if (!over) return;
    const activeData = active.data.current;
    const overData = over.data.current;

    if (activeData?.type === "materia" && overData?.type === "cell") {
      const materia = activeData.materia as Materia;
      const bloque: Bloque = {
        materiaCodigo: materia.codigo,
        dia: overData.dia,
        horaInicio: overData.horaInicio,
        horaFin: overData.horaFin,
      };
      const result = addBloqueLocal(bloque, materiasTodas);
      if (!result.ok) setError(result.error);
    }

    if (activeData?.type === "placed" && overData?.type === "pool") {
      const materiaCodigo = (activeData.materia as Materia).codigo;
      removeBloqueLocal(materiaCodigo);
    }
  }

  function handleRemoveBloque(codigo: string) {
    removeBloqueLocal(codigo);
  }

  function handleExpandBloque(codigo: string, unidades: number) {
    const result = expandBloqueLocal(codigo, unidades, materiasTodas);
    if (!result.ok) setError(result.error);
  }

  async function handleMarcarResultado(codigo: string, aprobada: boolean) {
    setResultados((prev) => ({ ...prev, [codigo]: aprobada }));
    try {
      await marcarResultado(codigo, aprobada);
    } catch {
      setResultados((prev) => {
        const next = { ...prev };
        delete next[codigo];
        return next;
      });
      setError(`Error al marcar ${codigo}`);
    }
  }

  const leyendaEmojis = [
    { emoji: "😊", label: "Aprobada", color: "#22c55e" },
    { emoji: "😢", label: "Perdida", color: "#ef4444" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-4)" }}>
      {/* Header info bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--spacing-2)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-3)" }}>
          {modo === "edicion" && (
            <span style={{
              padding: "2px 8px", borderRadius: "var(--radius-sm)", fontSize: "var(--font-size-xs)",
              background: "#dbeafe", color: "#1e40af", fontWeight: 600,
            }}>
              Modo edición
            </span>
          )}
          {modo === "curso" && (
            <span style={{
              padding: "2px 8px", borderRadius: "var(--radius-sm)", fontSize: "var(--font-size-xs)",
              background: "#dcfce7", color: "#166534", fontWeight: 600,
            }}>
              En curso
            </span>
          )}
          {modo === "finalizado" && (
            <span style={{
              padding: "2px 8px", borderRadius: "var(--radius-sm)", fontSize: "var(--font-size-xs)",
              background: "#f3f4f6", color: "#6b7280", fontWeight: 600,
            }}>
              Finalizado
            </span>
          )}
          <ContadorCreditos bloques={bloques} materias={materiasTodas} maxCreditos={horario.maxCreditos} />
        </div>

        {/* Emoji legend in curso mode */}
        {modo === "curso" && (
          <div style={{ display: "flex", gap: "var(--spacing-2)", fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>
            {leyendaEmojis.map(({ emoji, label, color }) => (
              <span key={label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: 14 }}>{emoji}</span>
                <span style={{ color }}>{label}</span>
              </span>
            ))}
          </div>
        )}

        {/* Finalizar button in curso mode */}
        {modo === "curso" && (
          <button
            type="button"
            onClick={() => onModoChange("finalizado")}
            disabled={Object.keys(resultados).length === 0}
            style={{
              padding: "0.4rem 1rem",
              background: Object.keys(resultados).length > 0 ? "var(--color-primary)" : "var(--color-muted-block)",
              color: "#fff",
              border: "none",
              borderRadius: "var(--radius-md)",
              cursor: Object.keys(resultados).length > 0 ? "pointer" : "not-allowed",
              fontSize: "var(--font-size-sm)",
              opacity: Object.keys(resultados).length > 0 ? 1 : 0.6,
            }}
          >
            Finalizar semestre
          </button>
        )}
      </div>

      {/* Error banner */}
      {error && (
        <div style={{
          padding: "var(--spacing-2) var(--spacing-3)", background: "#fef2f2",
          border: "1px solid #ef4444", borderRadius: "var(--radius-md)",
          color: "#ef4444", fontSize: "var(--font-size-sm)",
        }}>
          {error}
        </div>
      )}

      {/* Main area: grid + sidebar */}
      {modo === "edicion" ? (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "var(--spacing-4)", alignItems: "start" }}>
            <Grid
              bloques={bloques}
              materias={materiasTodas}
              unidadHoraMinutos={horario.unidadHoraMinutos}
              modo={modo}
              onRemoveBloque={handleRemoveBloque}
              onExpandBloque={handleExpandBloque}
            />

            <div style={{
              background: "var(--color-surface)", borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)", padding: "var(--spacing-3)",
              position: "sticky", top: "var(--spacing-3)",
            }}>
              <h3 style={{ fontSize: "var(--font-size-sm)", marginBottom: "var(--spacing-2)" }}>
                Materias ({materiasEnPool.length})
              </h3>

              {/* Filters */}
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-1)", marginBottom: "var(--spacing-2)" }}>
                <input
                  type="text" placeholder="Buscar..." value={filtroNombre}
                  onChange={(e) => setFiltroNombre(e.target.value)}
                  style={{
                    padding: "4px 8px", border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-sm)", fontSize: "var(--font-size-xs)",
                    background: "var(--color-surface)", color: "var(--color-text)",
                  }}
                />
                <div style={{ display: "flex", gap: "var(--spacing-1)" }}>
                  <select
                    value={filtroSemestre} onChange={(e) => setFiltroSemestre(e.target.value ? Number(e.target.value) : "")}
                    style={{
                      padding: "4px 8px", border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-sm)", fontSize: "var(--font-size-xs)",
                      background: "var(--color-surface)", color: "var(--color-text)", flex: 1,
                    }}
                  >
                    <option value="">Semestre</option>
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <input
                    type="number" placeholder="Créd. máx" value={filtroCreditos}
                    onChange={(e) => setFiltroCreditos(e.target.value ? Number(e.target.value) : "")}
                    style={{
                      padding: "4px 8px", border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-sm)", fontSize: "var(--font-size-xs)",
                      background: "var(--color-surface)", color: "var(--color-text)", width: 80,
                    }}
                  />
                </div>
              </div>

              {materiasEnPool.length === 0 ? (
                <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)", textAlign: "center", padding: "var(--spacing-3)" }}>
                  No hay materias disponibles
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-2)", maxHeight: "calc(100vh - 400px)", overflowY: "auto" }}>
                  {materiasEnPool.map((m) => (
                    <div key={m.codigo} style={{ fontSize: "var(--font-size-sm)" }}>
                      <MateriaBlock materia={m} />
                    </div>
                  ))}
                </div>
              )}
              <DropZone id="pool-drop" label="Suelta aquí para quitar del horario" />
            </div>
          </div>

          <DragOverlay>
            {activeMateria ? (
              <div style={{ transform: "rotate(3deg)", opacity: 0.9 }}>
                <MateriaBlock materia={activeMateria} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        /* Curso / Finalizado modes: no DndContext, no pool sidebar */
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "var(--spacing-4)" }}>
          {bloques.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "var(--color-text-muted)" }}>
              No hay materias en el horario
            </div>
          ) : (
            <Grid
              bloques={bloques}
              materias={materiasTodas}
              unidadHoraMinutos={horario.unidadHoraMinutos}
              modo={modo}
              onMarcarResultado={modo === "curso" ? handleMarcarResultado : undefined}
              resultados={resultados}
            />
          )}
        </div>
      )}
    </div>
  );
}
