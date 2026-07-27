import { useState } from "react";
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import type { Materia } from "../../pensum/types.ts";
import type { Bloque } from "../types.ts";
import { useHorarioStore } from "../store/horarioStore.ts";
import Grid from "./Grid.tsx";
import ContadorCreditos from "./ContadorCreditos.tsx";
import DropZone from "./DropZone.tsx";
import MateriaBlock from "../../pensum/components/MateriaBlock.tsx";

interface HorarioScreenProps {
  materias: Materia[];
  onVolver: () => void;
  onFinalizar: () => void;
}

export default function HorarioScreen({ materias, onVolver, onFinalizar }: HorarioScreenProps) {
  const horario = useHorarioStore((s) => s.horario);
  const addBloque = useHorarioStore((s) => s.addBloque);
  const removeBloque = useHorarioStore((s) => s.removeBloque);
  const [activeMateria, setActiveMateria] = useState<Materia | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const bloques = horario?.bloques ?? [];
  const codigosEnHorario = new Set(bloques.map((b) => b.materiaCodigo));
  const materiasEnPool = materias.filter((m) => !codigosEnHorario.has(m.codigo) && m.estado !== "cursado");

  function handleDragStart(event: DragStartEvent) {
    const data = event.active.data.current;
    if (data?.type === "materia" && data.materia) {
      setActiveMateria(data.materia as Materia);
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
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
      const result = await addBloque(bloque, materias);
      if (!result.ok) {
        setError(result.error);
      }
    }

    if (activeData?.type === "placed" && overData?.type === "pool") {
      const materiaCodigo = (activeData.materia as Materia).codigo;
      await removeBloque(materiaCodigo);
    }
  }

  async function handleRemoveBloque(codigo: string) {
    await removeBloque(codigo);
  }

  if (!horario) return null;

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-4)" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "var(--spacing-2)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-3)" }}>
            <span style={{ fontWeight: 600 }}>{horario.semestreLabel}</span>
            <ContadorCreditos
              bloques={bloques}
              materias={materias}
              maxCreditos={horario.maxCreditos}
            />
          </div>
          <div style={{ display: "flex", gap: "var(--spacing-2)" }}>
            <button type="button" onClick={onVolver} style={{
              padding: "0.4rem 0.8rem", background: "transparent", color: "var(--color-text-muted)",
              border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", cursor: "pointer", fontSize: "var(--font-size-sm)",
            }}>
              Volver al pensum
            </button>
            <button type="button" onClick={onFinalizar} style={{
              padding: "0.4rem 1rem", background: "var(--color-primary)", color: "#fff",
              border: "none", borderRadius: "var(--radius-md)", cursor: "pointer", fontSize: "var(--font-size-sm)",
            }}>
              Finalizar semestre
            </button>
          </div>
        </div>

        {error && (
          <div style={{
            padding: "var(--spacing-2) var(--spacing-3)", background: "var(--color-danger-bg, #fef2f2)",
            border: "1px solid var(--color-danger, #ef4444)", borderRadius: "var(--radius-md)",
            color: "var(--color-danger, #ef4444)", fontSize: "var(--font-size-sm)",
          }}>
            {error}
          </div>
        )}

        <div style={{
          display: "grid", gridTemplateColumns: "1fr 300px", gap: "var(--spacing-4)", alignItems: "start",
        }}>
          <Grid
            bloques={bloques}
            materias={materias}
            unidadHoraMinutos={horario.unidadHoraMinutos}
            onRemoveBloque={handleRemoveBloque}
          />

          <div style={{
            background: "var(--color-surface)", borderRadius: "var(--radius-md)",
            border: "1px solid var(--color-border)", padding: "var(--spacing-3)",
            position: "sticky", top: "var(--spacing-3)",
          }}>
            <h3 style={{ fontSize: "var(--font-size-sm)", marginBottom: "var(--spacing-2)" }}>
              Materias ({materiasEnPool.length})
            </h3>
            {materiasEnPool.length === 0 ? (
              <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)", textAlign: "center", padding: "var(--spacing-3)" }}>
                Todas las materias están en el horario
              </p>
            ) : (
              <div style={{
                display: "flex", flexDirection: "column", gap: "var(--spacing-2)",
                maxHeight: "calc(100vh - 300px)", overflowY: "auto",
              }}>
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
      </div>

      <DragOverlay>
        {activeMateria ? (
          <div style={{ transform: "rotate(3deg)", opacity: 0.9 }}>
            <MateriaBlock materia={activeMateria} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
