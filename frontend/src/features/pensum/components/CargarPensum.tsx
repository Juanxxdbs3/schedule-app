import { useState, useRef } from "react";
import type { SyntheticEvent } from "react";
import { HelpCircle } from "lucide-react";
import { PensumService } from "../services/PensumService.ts";
import type { Materia, Pensum } from "../types.ts";
import { validarPensumJson, type ResumenPensum } from "../utils/validarPensumJson.ts";
import { useUiStatusStore } from "../../../shared/store/uiStatusStore.ts";
import ModalPromptPensum from "./ModalPromptPensum.tsx";

interface CargarPensumProps {
  onPensumLoaded: (pensum: Pensum) => void;
  onCancel?: () => void;
}

type Pestana = "archivo" | "pegar";

type EstadoCarga =
  | { tipo: "inicial" }
  | { tipo: "validando" }
  | { tipo: "resumen"; nombre: string; materias: Materia[]; resumen: ResumenPensum }
  | { tipo: "error"; mensaje: string; errores?: string[] }
  | { tipo: "guardando" }
  | { tipo: "exito" };

export default function CargarPensum({ onPensumLoaded, onCancel }: CargarPensumProps) {
  const [estado, setEstado] = useState<EstadoCarga>({ tipo: "inicial" });
  const [pestana, setPestana] = useState<Pestana>("archivo");
  const [jsonPegado, setJsonPegado] = useState("");
  const [mostrarPrompt, setMostrarPrompt] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function procesarTexto(texto: string) {
    setEstado({ tipo: "validando" });

    let json: unknown;
    try {
      json = JSON.parse(texto);
    } catch {
      setEstado({
        tipo: "error",
        mensaje: "El texto no es un JSON válido. Revisa comillas dobles, comas finales y comentarios.",
      });
      return;
    }

    const resultado = validarPensumJson(json);
    if (!resultado.ok) {
      setEstado({
        tipo: "error",
        mensaje: "El pensum tiene errores. Corrígelos y vuelve a intentar:",
        errores: resultado.errores,
      });
      return;
    }

    setEstado({
      tipo: "resumen",
      nombre: resultado.data.nombre,
      materias: resultado.data.materias,
      resumen: resultado.resumen,
    });
  }

  function handleFileChange(e: SyntheticEvent<HTMLInputElement>) {
    const file = e.currentTarget.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".json")) {
      setEstado({ tipo: "error", mensaje: "El archivo debe tener extensión .json" });
      return;
    }

    setEstado({ tipo: "validando" });

    const reader = new FileReader();
    reader.onload = () => procesarTexto(reader.result as string);
    reader.onerror = () => {
      setEstado({ tipo: "error", mensaje: "Error al leer el archivo" });
    };
    reader.readAsText(file);
  }

  function handlePegar() {
    const texto = jsonPegado.trim();
    if (!texto) {
      setEstado({ tipo: "error", mensaje: "Pega el JSON antes de intentar cargarlo." });
      return;
    }
    procesarTexto(texto);
  }

  async function handleGuardar() {
    if (estado.tipo !== "resumen") return;

    setEstado({ tipo: "guardando" });
    useUiStatusStore.getState().setStatus("saving", "Guardando pensum...");

    try {
      const res = await PensumService.create(estado.nombre, estado.materias);
      PensumService.storage.save(res.pensum);
      setEstado({ tipo: "exito" });
      useUiStatusStore.getState().setStatus("success", "Pensum cargado correctamente");
      onPensumLoaded(res.pensum);
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : "Error al guardar el pensum en el servidor";
      const errores = (err as { errores?: string[] }).errores;
      setEstado({ tipo: "error", mensaje, errores });
      useUiStatusStore.getState().setStatus("error", mensaje);
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

      <div className="flex flex-col gap-2 mb-4">
        <p className="text-muted m-0">
          Sube el archivo JSON de tu pensum o pega el que te devolvió la IA.
        </p>
        <button
          type="button"
          onClick={() => setMostrarPrompt(true)}
          className="self-start inline-flex items-center gap-1 p-0 bg-transparent border-none text-sm text-primary underline cursor-pointer"
        >
          <HelpCircle className="w-4 h-4" aria-hidden="true" />
          ¿Cómo genero el JSON? Ver prompt
        </button>
      </div>

      {estado.tipo === "inicial" && (
        <>
          <div className="flex border border-border rounded-md overflow-hidden mb-3" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={pestana === "archivo"}
              onClick={() => setPestana("archivo")}
              className={`flex-1 px-3 py-2 text-sm font-medium border-none cursor-pointer transition-colors duration-150 ${
                pestana === "archivo" ? "bg-primary text-white" : "bg-surface text-muted"
              }`}
            >
              Subir archivo
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={pestana === "pegar"}
              onClick={() => setPestana("pegar")}
              className={`flex-1 px-3 py-2 text-sm font-medium border-none cursor-pointer transition-colors duration-150 ${
                pestana === "pegar" ? "bg-primary text-white" : "bg-surface text-muted"
              }`}
            >
              Pegar JSON
            </button>
          </div>

          {pestana === "archivo" ? (
            <label className="border-2 border-dashed border-border rounded-md p-4 text-center cursor-pointer transition-colors duration-150 bg-surface block">
              <div className="mb-2 text-2xl font-bold text-primary">{"{ }"}</div>
              <p className="font-medium text-text m-0">Haz clic para seleccionar el archivo JSON</p>
              <p className="text-sm text-muted m-0">Solo archivos .json</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          ) : (
            <div className="flex flex-col gap-2">
              <textarea
                value={jsonPegado}
                onChange={(e) => setJsonPegado(e.target.value)}
                rows={8}
                spellCheck={false}
                placeholder='{ "nombre": "Mi carrera", "materias": [ ... ] }'
                aria-label="JSON del pensum"
                className="w-full box-border p-2.5 border border-border rounded-md text-xs font-mono bg-surface text-text resize-y"
              />
              <button
                type="button"
                onClick={handlePegar}
                disabled={!jsonPegado.trim()}
                className="w-full px-4 py-2.5 bg-primary text-white border-none rounded-md cursor-pointer font-medium disabled:opacity-60"
              >
                Cargar
              </button>
            </div>
          )}

          {onCancel && (
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
        </>
      )}

      {estado.tipo === "validando" && (
        <div className="text-center p-4 text-muted">Validando pensum...</div>
      )}

      {estado.tipo === "resumen" && (
        <div className="bg-surface border border-border rounded-md p-4">
          <h3 className="mb-3">Resumen del pensum</h3>

          <div className="mb-2">
            <span className="font-semibold text-text">Nombre: </span>
            <span className="text-muted">{estado.nombre}</span>
          </div>

          <p className="text-sm text-muted m-0">
            Se detectaron {estado.resumen.materias}{" "}
            {estado.resumen.materias === 1 ? "materia" : "materias"}, {estado.resumen.creditosTotales}{" "}
            {estado.resumen.creditosTotales === 1 ? "crédito" : "créditos"}, {estado.resumen.semestres}{" "}
            {estado.resumen.semestres === 1 ? "semestre" : "semestres"}.
          </p>

          {estado.resumen.conPrerrequisitos === 0 && (
            <div className="mt-3 p-2 border border-warning rounded-md text-sm text-warning">
              Ninguna materia tiene prerrequisitos: el desbloqueo automático por prerrequisitos no
              funcionará con este pensum.
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <button
              type="button"
              onClick={handleGuardar}
              className="btn-primary px-4 py-2.5 bg-primary text-white border-none rounded-md cursor-pointer font-medium"
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
        <div className="text-center p-4 text-muted">Guardando pensum...</div>
      )}

      {estado.tipo === "error" && (
        <div className="bg-surface border border-danger rounded-md p-4">
          <p className="text-danger font-medium mb-3">{estado.mensaje}</p>

          {estado.errores && estado.errores.length > 0 && (
            <ul className="list-disc pl-5 m-0 mb-3 max-h-48 overflow-y-auto text-sm text-danger">
              {estado.errores.map((error, i) => (
                <li key={`${i}-${error}`} className="mb-1">
                  {error}
                </li>
              ))}
            </ul>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleReintentar}
              className="btn-primary px-4 py-2.5 bg-primary text-white border-none rounded-md cursor-pointer"
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

      <ModalPromptPensum isOpen={mostrarPrompt} onClose={() => setMostrarPrompt(false)} />
    </div>
  );
}
