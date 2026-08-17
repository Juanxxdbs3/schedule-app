import { useState, useRef } from "react";
import type { SyntheticEvent } from "react";
import { PensumService } from "../services/PensumService.ts";
import type { Materia, Pensum } from "../types.ts";

interface CargarPensumProps {
  onPensumLoaded: (pensum: Pensum) => void;
  onCancel?: () => void;
}

type EstadoCarga =
  | { tipo: "inicial" }
  | { tipo: "validando" }
  | { tipo: "resumen"; nombre: string; materias: Materia[]; raw: unknown }
  | { tipo: "error"; mensaje: string }
  | { tipo: "guardando" }
  | { tipo: "exito" };

export default function CargarPensum({ onPensumLoaded, onCancel }: CargarPensumProps) {
  const [estado, setEstado] = useState<EstadoCarga>({ tipo: "inicial" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: SyntheticEvent<HTMLInputElement>) {
    const file = e.currentTarget.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".json")) {
      setEstado({ tipo: "error", mensaje: "El archivo debe tener extensión .json" });
      return;
    }

    setEstado({ tipo: "validando" });

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const json = JSON.parse(reader.result as string);
        const result = PensumService.validateJSON(json);

        if (!result.ok) {
          setEstado({ tipo: "error", mensaje: result.error });
          return;
        }

        setEstado({
          tipo: "resumen",
          nombre: result.data.nombre,
          materias: result.data.materias,
          raw: json,
        });
      } catch {
        setEstado({ tipo: "error", mensaje: "El archivo no contiene un JSON válido" });
      }
    };
    reader.onerror = () => {
      setEstado({ tipo: "error", mensaje: "Error al leer el archivo" });
    };
    reader.readAsText(file);
  }

  async function handleGuardar() {
    if (estado.tipo !== "resumen") return;

    setEstado({ tipo: "guardando" });

    try {
      const res = await PensumService.create(estado.nombre, estado.materias);
      PensumService.storage.save(res.pensum);
      setEstado({ tipo: "exito" });
      onPensumLoaded(res.pensum);
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : "Error al guardar el pensum en el servidor";
      setEstado({
        tipo: "error",
        mensaje: `${mensaje}. El pensum se guardó solo localmente.`,
      });
    }
  }

  function handleReintentar() {
    setEstado({ tipo: "inicial" });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <div className="max-w-lg mx-auto p-4">
      <h2 className="text-lg font-semibold mb-3">Cargar pensum</h2>
      <p className="text-muted mb-4">
        Selecciona el archivo JSON de tu pensum para comenzar.
      </p>

      {estado.tipo === "inicial" && (
        <label className="border-2 border-dashed border-border rounded-md p-4 text-center cursor-pointer transition-colors duration-150 bg-surface block">
          <div className="mb-2 text-2xl font-bold text-primary">
            {"{ }"}
          </div>
          <p className="font-medium text-text">
            Haz clic para seleccionar el archivo JSON
          </p>
          <p className="text-sm text-muted">
            Solo archivos .json
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      )}

      {estado.tipo === "inicial" && onCancel && (
        <div className="mt-3 text-center">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-transparent text-muted border border-border rounded-md cursor-pointer"
          >
            Cancelar
          </button>
        </div>
      )}

      {estado.tipo === "validando" && (
        <div className="text-center p-4 text-muted">
          Validando pensum...
        </div>
      )}

      {estado.tipo === "resumen" && (
        <div className="bg-surface border border-border rounded-md p-4">
          <h3 className="mb-3">Resumen del pensum</h3>

          <div className="mb-3">
            <span className="font-semibold text-text">Nombre: </span>
            <span className="text-muted">{estado.nombre}</span>
          </div>

          <div className="mb-4">
            <span className="font-semibold text-text">Materias: </span>
            <span className="text-muted">{estado.materias.length}</span>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleGuardar}
              className="px-4 py-2 bg-primary text-white border-none rounded-md cursor-pointer font-medium"
            >
              Guardar pensum
            </button>
            <button
              type="button"
              onClick={onCancel ?? handleReintentar}
              className="px-4 py-2 bg-transparent text-muted border border-border rounded-md cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {estado.tipo === "guardando" && (
        <div className="text-center p-4 text-muted">
          Guardando pensum...
        </div>
      )}

      {estado.tipo === "error" && (
        <div className="bg-surface border border-danger rounded-md p-4">
          <p className="text-danger font-medium mb-3">
            {estado.mensaje}
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleReintentar}
              className="px-4 py-2 bg-primary text-white border-none rounded-md cursor-pointer"
            >
              Intentar de nuevo
            </button>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 bg-transparent text-muted border border-border rounded-md cursor-pointer"
              >
                Cancelar
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
