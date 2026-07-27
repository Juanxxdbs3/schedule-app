import { useState } from "react";
import type { Materia } from "../types.ts";
import { filtrarMaterias } from "../../../shared/utils/filterMaterias.ts";

interface FiltroPensumProps {
  materias: Materia[];
  onFilter: (filtradas: Materia[]) => void;
}

export default function FiltroPensum({ materias, onFilter }: FiltroPensumProps) {
  const [nombre, setNombre] = useState("");
  const [semestre, setSemestre] = useState<number | "">("");
  const [creditosMax, setCreditosMax] = useState<number | "">("");

  function handleNombre(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setNombre(v);
    onFilter(filtrarMaterias(materias, v, semestre, creditosMax));
  }

  function handleSemestre(e: React.ChangeEvent<HTMLSelectElement>) {
    const v = e.target.value ? Number(e.target.value) : "";
    setSemestre(v);
    onFilter(filtrarMaterias(materias, nombre, v, creditosMax));
  }

  function handleCreditos(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value ? Number(e.target.value) : "";
    setCreditosMax(v);
    onFilter(filtrarMaterias(materias, nombre, semestre, v));
  }

  const semestreOptions = Array.from({ length: 10 }, (_, i) => i + 1);

  const containerStyle: React.CSSProperties = {
    display: "flex",
    gap: "var(--spacing-3)",
    flexWrap: "wrap",
    alignItems: "flex-end",
    marginBottom: "var(--spacing-4)",
  };

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
    minWidth: 160,
  };

  return (
    <div style={containerStyle}>
      <div style={fieldStyle}>
        <label htmlFor="filtro-nombre" style={labelStyle}>Nombre</label>
        <input
          id="filtro-nombre"
          type="text"
          placeholder="Buscar materia..."
          value={nombre}
          onChange={handleNombre}
          style={inputStyle}
        />
      </div>

      <div style={fieldStyle}>
        <label htmlFor="filtro-semestre" style={labelStyle}>Semestre</label>
        <select
          id="filtro-semestre"
          value={semestre}
          onChange={handleSemestre}
          style={inputStyle}
        >
          <option value="">Todos</option>
          {semestreOptions.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div style={fieldStyle}>
        <label htmlFor="filtro-creditos" style={labelStyle}>Créditos máx.</label>
        <input
          id="filtro-creditos"
          type="number"
          min={1}
          placeholder="Sin límite"
          value={creditosMax}
          onChange={handleCreditos}
          style={{ ...inputStyle, minWidth: 120 }}
        />
      </div>
    </div>
  );
}
