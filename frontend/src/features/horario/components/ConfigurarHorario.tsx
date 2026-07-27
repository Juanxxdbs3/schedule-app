import { useState } from "react";

interface ConfigurarHorarioProps {
  onSubmit: (params: { semestreLabel: string; maxCreditos: number; unidadHoraMinutos: number }) => void;
  loading: boolean;
}

export default function ConfigurarHorario({ onSubmit, loading }: ConfigurarHorarioProps) {
  const [semestreLabel, setSemestreLabel] = useState("2026-2");
  const [maxCreditos, setMaxCreditos] = useState(18);
  const [unidadHoraMinutos, setUnidadHoraMinutos] = useState(50);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({ semestreLabel: semestreLabel.trim(), maxCreditos, unidadHoraMinutos });
  }

  return (
    <div className="max-w-md mx-auto py-6 px-4">
      <h2 className="mb-4">Configurar horario</h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="semestre-label" className="text-sm text-muted font-medium">
            Etiqueta del semestre
          </label>
          <input
            id="semestre-label"
            type="text"
            value={semestreLabel}
            onChange={(e) => setSemestreLabel(e.target.value)}
            className="px-3 py-2 border border-border rounded-md bg-surface text-text text-md"
            placeholder="ej. 2026-2"
            required
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="max-creditos" className="text-sm text-muted font-medium">
            Créditos máximos
          </label>
          <input
            id="max-creditos"
            type="number"
            min={1}
            value={maxCreditos}
            onChange={(e) => setMaxCreditos(Number(e.target.value))}
            className="px-3 py-2 border border-border rounded-md bg-surface text-text text-md"
            required
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="unidad-hora" className="text-sm text-muted font-medium">
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
            className="px-3 py-2 border border-border rounded-md bg-surface text-text text-md"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`px-5 py-3 text-white border-none rounded-md cursor-pointer text-md font-semibold mt-2 ${
            loading ? "bg-primary-muted cursor-not-allowed" : "bg-primary cursor-pointer"
          }`}
        >
          {loading ? "Creando..." : "Crear horario"}
        </button>
      </form>
    </div>
  );
}
