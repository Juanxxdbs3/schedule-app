import { useState, useRef } from "react";
import type { SyntheticEvent } from "react";
import { PensumService } from "../services/PensumService.ts";
import type { Materia, Pensum } from "../types.ts";

interface CargarPensumProps {
  onPensumLoaded: (pensum: Pensum) => void;
}

type EstadoCarga =
  | { tipo: "inicial" }
  | { tipo: "validando" }
  | { tipo: "resumen"; nombre: string; materias: Materia[]; raw: unknown }
  | { tipo: "error"; mensaje: string }
  | { tipo: "guardando" }
  | { tipo: "exito" };

export default function CargarPensum({ onPensumLoaded }: CargarPensumProps) {
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

  const containerStyle: React.CSSProperties = {
    maxWidth: 600,
    margin: "0 auto",
    padding: "var(--spacing-4)",
  };

  const dropZoneStyle: React.CSSProperties = {
    border: "2px dashed var(--color-border)",
    borderRadius: "var(--radius-md)",
    padding: "var(--spacing-4)",
    textAlign: "center",
    cursor: "pointer",
    transition: "border-color 0.15s",
    background: "var(--color-surface)",
  };

  const titleStyle: React.CSSProperties = {
    fontSize: "var(--font-size-lg)",
    fontWeight: 600,
    marginBottom: "var(--spacing-3)",
  };

  return (
    <div style={containerStyle}>
      <h2 style={titleStyle}>Cargar pensum</h2>
      <p style={{ color: "var(--color-text-muted)", marginBottom: "var(--spacing-4)" }}>
        Selecciona el archivo JSON de tu pensum para comenzar.
      </p>

      {estado.tipo === "inicial" && (
        <label style={dropZoneStyle}>
          <div
            style={{
              marginBottom: "var(--spacing-2)",
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "var(--color-primary)",
            }}
          >
            {"{ }"}
          </div>
          <p style={{ fontWeight: 500, color: "var(--color-text)" }}>
            Haz clic para seleccionar el archivo JSON
          </p>
          <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)" }}>
            Solo archivos .json
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
        </label>
      )}

      {estado.tipo === "validando" && (
        <div style={{ textAlign: "center", padding: "var(--spacing-4)", color: "var(--color-text-muted)" }}>
          Validando pensum...
        </div>
      )}

      {estado.tipo === "resumen" && (
        <div
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            padding: "var(--spacing-4)",
          }}
        >
          <h3 style={{ marginBottom: "var(--spacing-3)" }}>Resumen del pensum</h3>

          <div style={{ marginBottom: "var(--spacing-3)" }}>
            <span style={{ fontWeight: 600, color: "var(--color-text)" }}>Nombre: </span>
            <span style={{ color: "var(--color-text-muted)" }}>{estado.nombre}</span>
          </div>

          <div style={{ marginBottom: "var(--spacing-4)" }}>
            <span style={{ fontWeight: 600, color: "var(--color-text)" }}>Materias: </span>
            <span style={{ color: "var(--color-text-muted)" }}>{estado.materias.length}</span>
          </div>

          <div style={{ display: "flex", gap: "var(--spacing-3)" }}>
            <button
              type="button"
              onClick={handleGuardar}
              style={{
                padding: "var(--spacing-2) var(--spacing-4)",
                background: "var(--color-primary)",
                color: "#fff",
                border: "none",
                borderRadius: "var(--radius-md)",
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              Guardar pensum
            </button>
            <button
              type="button"
              onClick={handleReintentar}
              style={{
                padding: "var(--spacing-2) var(--spacing-4)",
                background: "transparent",
                color: "var(--color-text-muted)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                cursor: "pointer",
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {estado.tipo === "guardando" && (
        <div style={{ textAlign: "center", padding: "var(--spacing-4)", color: "var(--color-text-muted)" }}>
          Guardando pensum...
        </div>
      )}

      {estado.tipo === "error" && (
        <div
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-danger)",
            borderRadius: "var(--radius-md)",
            padding: "var(--spacing-4)",
          }}
        >
          <p style={{ color: "var(--color-danger)", fontWeight: 500, marginBottom: "var(--spacing-3)" }}>
            {estado.mensaje}
          </p>
          <button
            type="button"
            onClick={handleReintentar}
            style={{
              padding: "var(--spacing-2) var(--spacing-4)",
              background: "var(--color-primary)",
              color: "#fff",
              border: "none",
              borderRadius: "var(--radius-md)",
              cursor: "pointer",
            }}
          >
            Intentar de nuevo
          </button>
        </div>
      )}
    </div>
  );
}
