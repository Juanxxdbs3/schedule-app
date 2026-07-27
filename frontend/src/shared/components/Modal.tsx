import { useEffect, type ReactNode } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
}

export default function Modal({ isOpen, onClose, children, title }: ModalProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-surface border border-border rounded-lg shadow-lg w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="px-5 pt-5 pb-0">
            <h2 className="text-lg m-0">{title}</h2>
          </div>
        )}
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
