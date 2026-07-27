import { useDroppable } from "@dnd-kit/core";

interface DropZoneProps {
  id: string;
  label?: string;
}

export default function DropZone({ id, label }: DropZoneProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: { type: "pool" },
  });

  return (
    <div
      ref={setNodeRef}
      className={`mt-3 p-3 rounded-md text-center text-sm transition-all duration-150 min-h-12 flex items-center justify-center ${
        isOver
          ? "border-2 border-dashed border-primary text-primary bg-primary-muted"
          : "border-2 border-dashed border-border text-muted bg-transparent"
      }`}
    >
      {label ?? "Suelta aquí para quitar del horario"}
    </div>
  );
}
