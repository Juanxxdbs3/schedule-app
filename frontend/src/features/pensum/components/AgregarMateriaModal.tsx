import { useState, type FormEvent } from "react";
import Modal from "../../../shared/components/Modal.tsx";
import type { Materia } from "../types.ts";

interface AgregarMateriaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGuardar: (materia: Materia) => Promise<void>;
}

const ESTADOS: Materia["estado"][] = ["activo", "matriculado", "cursado", "en_espera"];

export default function AgregarMateriaModal({ isOpen, onClose, onGuardar }: AgregarMateriaModalProps) {
  const [codigo, setCodigo] = useState("");
  const [nombre, setNombre] = useState("");
  const [creditos, setCreditos] = useState("3");
  const [semestre, setSemestre] = useState("1");
  const [requiere, setRequiere] = useState("");
  const [estado, setEstado] = useState<Materia["estado"]>("activo");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setGuardando(true);
    try {
      const materia: Materia = {
        codigo: codigo.trim(),
        nombre: nombre.trim(),
        creditos: Number(creditos),
        semestre: Number(semestre),
        requiere: requiere.split(",").map((s) => s.trim()).filter(Boolean),
        estado,
      };
      await onGuardar(materia);
      setCodigo("");
      setNombre("");
      setCreditos("3");
      setSemestre("1");
      setRequiere("");
      setEstado("activo");
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al guardar la materia";
      setError(msg);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Agregar materia">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted">Código</label>
          <input
            type="text" value={codigo} onChange={(e) => setCodigo(e.target.value)} required
            className="px-2.5 py-1.5 border border-border rounded-md text-sm bg-surface text-text"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted">Nombre</label>
          <input
            type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required
            className="px-2.5 py-1.5 border border-border rounded-md text-sm bg-surface text-text"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted">Créditos</label>
            <input
              type="number" min={1} step={1} value={creditos} onChange={(e) => setCreditos(e.target.value)} required
              className="px-2.5 py-1.5 border border-border rounded-md text-sm bg-surface text-text"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted">Semestre</label>
            <input
              type="number" min={1} step={1} value={semestre} onChange={(e) => setSemestre(e.target.value)} required
              className="px-2.5 py-1.5 border border-border rounded-md text-sm bg-surface text-text"
            />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted">Requiere (códigos separados por coma)</label>
          <input
            type="text" value={requiere} onChange={(e) => setRequiere(e.target.value)}
            placeholder="MAT101, MAT102"
            className="px-2.5 py-1.5 border border-border rounded-md text-sm bg-surface text-text"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted">Estado</label>
          <select
            value={estado} onChange={(e) => setEstado(e.target.value as Materia["estado"])}
            className="px-2.5 py-1.5 border border-border rounded-md text-sm bg-surface text-text"
          >
            {ESTADOS.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </div>
        {error && <p className="text-danger text-sm">{error}</p>}
        <div className="flex justify-end gap-2 mt-1">
          <button type="button" onClick={onClose}
            className="px-3 py-1.5 text-sm border border-border rounded-md bg-transparent text-text cursor-pointer">
            Cancelar
          </button>
          <button type="submit" disabled={guardando}
            className="btn-primary px-4 py-2 text-sm border-none rounded-md bg-primary text-white cursor-pointer disabled:opacity-60">
            {guardando ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}