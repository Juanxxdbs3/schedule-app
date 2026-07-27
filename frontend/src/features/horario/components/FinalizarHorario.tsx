import { useState } from "react";
import type { Bloque } from "../types.ts";
import type { Materia } from "../../pensum/types.ts";

interface FinalizarHorarioProps {
  bloques: Bloque[];
  materias: Materia[];
  onMarcar: (codigo: string, aprobada: boolean) => Promise<void>;
  onCerrar: () => Promise<void>;
  onCancelar: () => void;
}

export default function FinalizarHorario({ bloques, materias, onMarcar, onCerrar, onCancelar }: FinalizarHorarioProps) {
  const [resultados, setResultados] = useState<Record<string, boolean>>({});
  const [cerrando, setCerrando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const materiaMap = new Map(materias.map((m) => [m.codigo, m]));

  const todasMarcadas = bloques.every((b) => resultados[b.materiaCodigo] !== undefined);

  async function handleToggle(codigo: string, aprobada: boolean) {
    setResultados((prev) => ({ ...prev, [codigo]: aprobada }));
    try {
      await onMarcar(codigo, aprobada);
    } catch {
      setResultados((prev) => {
        const next = { ...prev };
        delete next[codigo];
        return next;
      });
      setError(`Error al marcar ${codigo}`);
    }
  }

  async function handleCerrar() {
    setCerrando(true);
    setError(null);
    try {
      await onCerrar();
    } catch {
      setError("Error al cerrar el semestre");
      setCerrando(false);
    }
  }

  return (
    <div style={{ maxWidth: 500, margin: "0 auto", padding: "var(--spacing-4)" }}>
      <h2 style={{ marginBottom: "var(--spacing-4)" }}>Finalizar semestre</h2>
      <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)", marginBottom: "var(--spacing-4)" }}>
        Marca cada materia como aprobada o perdida
      </p>

      {error && (
        <div style={{
          padding: "var(--spacing-2) var(--spacing-3)",
          background: "var(--color-danger-bg, #fef2f2)",
          border: "1px solid var(--color-danger, #ef4444)",
          borderRadius: "var(--radius-md)",
          color: "var(--color-danger, #ef4444)",
          fontSize: "var(--font-size-sm)",
          marginBottom: "var(--spacing-3)",
        }}>
          {error}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-2)" }}>
        {bloques.map((b) => {
          const m = materiaMap.get(b.materiaCodigo);
          if (!m) return null;
          const marcado = resultados[b.materiaCodigo];

          return (
            <div
              key={b.materiaCodigo}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "var(--spacing-3)",
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: "var(--font-size-sm)" }}>{m.nombre}</div>
                <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>
                  {m.codigo} · {m.creditos} créditos
                </div>
              </div>
              <div style={{ display: "flex", gap: "var(--spacing-2)" }}>
                <button
                  type="button"
                  onClick={() => handleToggle(b.materiaCodigo, true)}
                  style={{
                    padding: "0.3rem 0.8rem",
                    border: `1px solid ${marcado === true ? "var(--color-success, #22c55e)" : "var(--color-border)"}`,
                    borderRadius: "var(--radius-sm)",
                    background: marcado === true ? "var(--color-success-bg, #f0fdf4)" : "transparent",
                    color: marcado === true ? "var(--color-success, #22c55e)" : "var(--color-text-muted)",
                    cursor: "pointer",
                    fontSize: "var(--font-size-sm)",
                  }}
                >
                  Aprobada
                </button>
                <button
                  type="button"
                  onClick={() => handleToggle(b.materiaCodigo, false)}
                  style={{
                    padding: "0.3rem 0.8rem",
                    border: `1px solid ${marcado === false ? "var(--color-danger, #ef4444)" : "var(--color-border)"}`,
                    borderRadius: "var(--radius-sm)",
                    background: marcado === false ? "var(--color-danger-bg, #fef2f2)" : "transparent",
                    color: marcado === false ? "var(--color-danger, #ef4444)" : "var(--color-text-muted)",
                    cursor: "pointer",
                    fontSize: "var(--font-size-sm)",
                  }}
                >
                  Perdida
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: "var(--spacing-3)", marginTop: "var(--spacing-4)" }}>
        <button
          type="button"
          onClick={onCancelar}
          style={{
            padding: "0.5rem 1.2rem",
            background: "transparent",
            color: "var(--color-text-muted)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            cursor: "pointer",
            flex: 1,
          }}
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleCerrar}
          disabled={!todasMarcadas || cerrando}
          style={{
            padding: "0.5rem 1.2rem",
            background: todasMarcadas && !cerrando ? "var(--color-primary)" : "var(--color-muted-block)",
            color: "#fff",
            border: "none",
            borderRadius: "var(--radius-md)",
            cursor: todasMarcadas && !cerrando ? "pointer" : "not-allowed",
            flex: 1,
            opacity: todasMarcadas ? 1 : 0.6,
          }}
        >
          {cerrando ? "Cerrando..." : "Cerrar semestre"}
        </button>
      </div>
    </div>
  );
}
