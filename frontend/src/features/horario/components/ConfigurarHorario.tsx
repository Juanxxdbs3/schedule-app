import { useState } from "react";

interface ConfigurarHorarioProps {
  onSubmit: (params: { semestreLabel: string; maxCreditos: number; unidadHoraMinutos: number }) => void;
  loading: boolean;
}

const fieldStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--spacing-1)",
};

const labelStyle: React.CSSProperties = {
  fontSize: "var(--font-size-sm)",
  color: "var(--color-text-muted)",
  fontWeight: 500,
};

const inputStyle: React.CSSProperties = {
  padding: "var(--spacing-2) var(--spacing-3)",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-md)",
  background: "var(--color-surface)",
  color: "var(--color-text)",
  fontSize: "var(--font-size-md)",
};

export default function ConfigurarHorario({ onSubmit, loading }: ConfigurarHorarioProps) {
  const [semestreLabel, setSemestreLabel] = useState("2026-2");
  const [maxCreditos, setMaxCreditos] = useState(18);
  const [unidadHoraMinutos, setUnidadHoraMinutos] = useState(50);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({ semestreLabel: semestreLabel.trim(), maxCreditos, unidadHoraMinutos });
  }

  return (
    <div
      style={{
        maxWidth: 480,
        margin: "0 auto",
        padding: "var(--spacing-6) var(--spacing-4)",
      }}
    >
      <h2 style={{ marginBottom: "var(--spacing-4)" }}>Configurar horario</h2>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-4)" }}>
        <div style={fieldStyle}>
          <label htmlFor="semestre-label" style={labelStyle}>
            Etiqueta del semestre
          </label>
          <input
            id="semestre-label"
            type="text"
            value={semestreLabel}
            onChange={(e) => setSemestreLabel(e.target.value)}
            style={inputStyle}
            placeholder="ej. 2026-2"
            required
          />
        </div>

        <div style={fieldStyle}>
          <label htmlFor="max-creditos" style={labelStyle}>
            Créditos máximos
          </label>
          <input
            id="max-creditos"
            type="number"
            min={1}
            value={maxCreditos}
            onChange={(e) => setMaxCreditos(Number(e.target.value))}
            style={inputStyle}
            required
          />
        </div>

        <div style={fieldStyle}>
          <label htmlFor="unidad-hora" style={labelStyle}>
            Unidad de hora (minutos)
          </label>
          <input
            id="unidad-hora"
            type="number"
            min={10}
            max={120}
            step={5}
            value={unidadHoraMinutos}
            onChange={(e) => setUnidadHoraMinutos(Number(e.target.value))}
            style={inputStyle}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "var(--spacing-3) var(--spacing-5)",
            background: loading ? "var(--color-primary-muted)" : "var(--color-primary)",
            color: "#fff",
            border: "none",
            borderRadius: "var(--radius-md)",
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: "var(--font-size-md)",
            fontWeight: 600,
            marginTop: "var(--spacing-2)",
          }}
        >
          {loading ? "Creando..." : "Crear horario"}
        </button>
      </form>
    </div>
  );
}
