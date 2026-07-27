import type { Materia } from "../types.ts";
import MateriaBlock from "./MateriaBlock.tsx";

interface PoolMateriasProps {
  materias: Materia[];
}

const ORDER: Record<string, number> = {
  matriculado: 0,
  activo: 1,
  en_espera: 2,
  cursado: 3,
};

export default function PoolMaterias({ materias }: PoolMateriasProps) {
  const ordenadas = [...materias].sort((a, b) => (ORDER[a.estado] ?? 99) - (ORDER[b.estado] ?? 99));

  if (ordenadas.length === 0) {
    return (
      <div className="text-center p-4 text-muted border-2 border-dashed border-border rounded-md">
        No hay materias disponibles
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm text-muted mb-3">
        {ordenadas.length} materia{ordenadas.length !== 1 ? "s" : ""} disponible{ordenadas.length !== 1 ? "s" : ""}
      </p>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3">
        {ordenadas.map((m) => (
          <MateriaBlock key={m.codigo} materia={m} />
        ))}
      </div>
    </div>
  );
}
