import { useState, type FormEvent } from "react";
import Modal from "../../../shared/components/Modal.tsx";
import type { Bloque } from "../types.ts";

interface EditBloqueModalProps {
  isOpen: boolean;
  bloque: Bloque;
  materiaNombre: string;
  onClose: () => void;
  onSave: (bloqueId: string, data: { nombrePersonalizado: string; profesor: string; salon: string }) => void;
}

export default function EditBloqueModal({ isOpen, bloque, materiaNombre, onClose, onSave }: EditBloqueModalProps) {
  const [nombrePersonalizado, setNombrePersonalizado] = useState(bloque.nombrePersonalizado ?? "");
  const [profesor, setProfesor] = useState(bloque.profesor ?? "");
  const [salon, setSalon] = useState(bloque.salon ?? "");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSave(bloque.id, { nombrePersonalizado, profesor, salon });
    onClose();
  }

  function handleCancel() {
    setNombrePersonalizado(bloque.nombrePersonalizado ?? "");
    setProfesor(bloque.profesor ?? "");
    setSalon(bloque.salon ?? "");
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={handleCancel} title="Editar bloque">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted">Nombre a mostrar</label>
          <input
            type="text" value={nombrePersonalizado} onChange={(e) => setNombrePersonalizado(e.target.value)}
            placeholder={materiaNombre}
            className="px-2.5 py-1.5 border border-border rounded-md text-sm bg-surface text-text"
          />
          {!nombrePersonalizado && (
            <span className="text-[10px] text-muted">Se mostrará: <strong>{materiaNombre}</strong></span>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted">Profesor</label>
          <input
            type="text" value={profesor} onChange={(e) => setProfesor(e.target.value)}
            placeholder="Opcional"
            className="px-2.5 py-1.5 border border-border rounded-md text-sm bg-surface text-text"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted">Salón</label>
          <input
            type="text" value={salon} onChange={(e) => setSalon(e.target.value)}
            placeholder="Opcional"
            className="px-2.5 py-1.5 border border-border rounded-md text-sm bg-surface text-text"
          />
        </div>
        <div className="flex justify-end gap-2 mt-1">
          <button type="button" onClick={handleCancel}
            className="px-3 py-1.5 text-sm border border-border rounded-md bg-transparent text-text cursor-pointer">
            Cancelar
          </button>
          <button type="submit"
            className="px-3 py-1.5 text-sm border-none rounded-md bg-primary text-white cursor-pointer">
            Guardar
          </button>
        </div>
      </form>
    </Modal>
  );
}
