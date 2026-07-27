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
    <div className="max-w-md mx-auto p-4">
      <h2 className="mb-4">Finalizar semestre</h2>
      <p className="text-sm text-muted mb-4">
        Marca cada materia como aprobada o perdida
      </p>

      {error && (
        <div className="px-3 py-2 bg-danger-bg border border-solid border-danger rounded-md text-danger text-sm mb-3">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-2">
        {bloques.map((b) => {
          const m = materiaMap.get(b.materiaCodigo);
          if (!m) return null;
          const marcado = resultados[b.materiaCodigo];

          return (
            <div
              key={b.materiaCodigo}
              className="flex justify-between items-center p-3 bg-surface border border-border rounded-md"
            >
              <div>
                <div className="font-semibold text-sm">{m.nombre}</div>
                <div className="text-xs text-muted">
                  {m.codigo} · {m.creditos} créditos
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleToggle(b.materiaCodigo, true)}
                  className={`px-3 py-1 rounded-sm cursor-pointer text-sm ${
                    marcado === true
                      ? "border border-solid border-success bg-success-bg text-success"
                      : "border border-solid border-border bg-transparent text-muted"
                  }`}
                >
                  Aprobada
                </button>
                <button
                  type="button"
                  onClick={() => handleToggle(b.materiaCodigo, false)}
                  className={`px-3 py-1 rounded-sm cursor-pointer text-sm ${
                    marcado === false
                      ? "border border-solid border-danger bg-danger-bg text-danger"
                      : "border border-solid border-border bg-transparent text-muted"
                  }`}
                >
                  Perdida
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-3 mt-4">
        <button
          type="button"
          onClick={onCancelar}
          className="flex-1 px-5 py-2 bg-transparent text-muted border border-border rounded-md cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleCerrar}
          disabled={!todasMarcadas || cerrando}
          className={`flex-1 px-5 py-2 text-white border-none rounded-md ${
            todasMarcadas && !cerrando
              ? "bg-primary cursor-pointer opacity-100"
              : "bg-muted-block cursor-not-allowed opacity-60"
          }`}
        >
          {cerrando ? "Cerrando..." : "Cerrar semestre"}
        </button>
      </div>
    </div>
  );
}
