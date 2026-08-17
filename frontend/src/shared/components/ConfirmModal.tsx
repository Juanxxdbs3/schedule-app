import Modal from "./Modal.tsx";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = "Confirmar",
  onClose,
  onConfirm,
}: ConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="flex flex-col gap-4">
        <p className="text-sm text-text">{message}</p>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose}
            className="px-3 py-1.5 text-sm border border-border rounded-md bg-transparent text-text cursor-pointer">
            Cancelar
          </button>
          <button type="button" onClick={() => void onConfirm()}
            className="px-4 py-2 text-sm border-none rounded-md bg-danger text-white cursor-pointer font-semibold">
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}