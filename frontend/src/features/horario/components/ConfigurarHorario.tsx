import { useState } from "react";
import Modal from "../../../shared/components/Modal.tsx";
import type { Pensum } from "../../pensum/types.ts";

interface ConfigurarHorarioProps {
  isOpen: boolean;
  onClose: () => void;
  pensums: Pensum[];
  pensumIdInicial?: string;
  onSubmit: (params: { pensumId: string; semestreLabel: string; maxCreditos: number; unidadHoraMinutos: number }) => void;
  loading: boolean;
  error?: string | null;
}

export default function ConfigurarHorario({
  isOpen, onClose, pensums, pensumIdInicial, onSubmit, loading, error,
}: ConfigurarHorarioProps) {
  const [pensumId, setPensumId] = useState(pensumIdInicial || (pensums[0]?.id ?? ""));
  const [semestreLabel, setSemestreLabel] = useState("2026-2");
  const [maxCreditos, setMaxCreditos] = useState(18);
  const [unidadHoraMinutos, setUnidadHoraMinutos] = useState(50);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pensumId) return;
    onSubmit({ pensumId, semestreLabel: semestreLabel.trim(), maxCreditos, unidadHoraMinutos });
  }

  function handleCancel() {
    setSemestreLabel("2026-2");
    setMaxCreditos(18);
    setUnidadHoraMinutos(50);
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={handleCancel} title="Configurar horario">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <div className="p-2 bg-danger-bg border border-danger rounded-sm text-xs text-danger">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label htmlFor="modal-pensum" className="text-sm text-muted font-medium">Pensum</label>
          <select
            id="modal-pensum"
            value={pensumId}
            onChange={(e) => setPensumId(e.target.value)}
            className="px-3 py-2 border border-border rounded-md bg-surface text-text text-md"
          >
            {pensums.map((p) => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="modal-semestre" className="text-sm text-muted font-medium">Etiqueta del semestre</label>
          <input
            id="modal-semestre"
            type="text"
            value={semestreLabel}
            onChange={(e) => setSemestreLabel(e.target.value)}
            className="px-3 py-2 border border-border rounded-md bg-surface text-text text-md"
            placeholder="ej. 2026-2"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="modal-creditos" className="text-sm text-muted font-medium">Créditos máx</label>
            <input
              id="modal-creditos"
              type="number"
              min={1}
              value={maxCreditos}
              onChange={(e) => setMaxCreditos(Number(e.target.value))}
              className="px-3 py-2 border border-border rounded-md bg-surface text-text text-md"
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="modal-unidad" className="text-sm text-muted font-medium">Unidad (min)</label>
            <input
              id="modal-unidad"
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
        </div>

        <div className="flex gap-3 mt-1">
          <button
            type="button"
            onClick={handleCancel}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-transparent text-text border border-border rounded-md cursor-pointer text-md font-semibold"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || !pensumId}
            className={`btn-primary flex-1 px-4 py-2 text-white border-none rounded-md cursor-pointer text-md font-semibold ${
              loading || !pensumId ? "bg-muted-block cursor-not-allowed" : "bg-primary cursor-pointer"
            }`}
          >
            {loading ? "Creando..." : "Crear horario"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
