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
      style={{
        marginTop: "var(--spacing-3)",
        padding: "var(--spacing-3)",
        border: `2px dashed ${isOver ? "var(--color-primary)" : "var(--color-border)"}`,
        borderRadius: "var(--radius-md)",
        textAlign: "center",
        fontSize: "var(--font-size-sm)",
        color: isOver ? "var(--color-primary)" : "var(--color-text-muted)",
        background: isOver ? "var(--color-primary-muted, #dbeafe)" : "transparent",
        transition: "all 0.15s",
        minHeight: 48,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {label ?? "Suelta aquí para quitar del horario"}
    </div>
  );
}
