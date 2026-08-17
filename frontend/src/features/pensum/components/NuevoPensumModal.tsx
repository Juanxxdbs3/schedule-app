import { useState, type FormEvent } from "react";
import Modal from "../../../shared/components/Modal.tsx";

interface NuevoPensumModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCrear: (nombre: string) => Promise<void>;
}

export default function NuevoPensumModal({ isOpen, onClose, onCrear }: NuevoPensumModalProps) {
  const [nombre, setNombre] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setGuardando(true);
    try {
      await onCrear(nombre.trim());
      setNombre("");
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al crear el pensum";
      setError(msg);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nuevo pensum">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted">Nombre de la carrera</label>
          <input
            type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required
            placeholder="Ej. Ingeniería de Sistemas"
            className="px-2.5 py-1.5 border border-border rounded-md text-sm bg-surface text-text"
          />
        </div>
        <p className="text-xs text-muted">El pensum se crea vacío y podrás ir agregando materias después.</p>
        {error && <p className="text-danger text-sm">{error}</p>}
        <div className="flex justify-end gap-2 mt-1">
          <button type="button" onClick={onClose}
            className="px-3 py-1.5 text-sm border border-border rounded-md bg-transparent text-text cursor-pointer">
            Cancelar
          </button>
          <button type="submit" disabled={guardando}
            className="btn-primary px-4 py-2 text-sm border-none rounded-md bg-primary text-white cursor-pointer disabled:opacity-60">
            {guardando ? "Creando..." : "Crear"}
          </button>
        </div>
      </form>
    </Modal>
  );
}