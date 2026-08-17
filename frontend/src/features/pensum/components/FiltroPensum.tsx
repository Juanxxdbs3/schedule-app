import { useState } from "react";
import type { Materia } from "../types.ts";
import { filtrarMaterias } from "../../../shared/utils/filterMaterias.ts";

interface FiltroPensumProps {
  materias: Materia[];
  onFilter: (filtradas: Materia[]) => void;
}

export default function FiltroPensum({ materias, onFilter }: FiltroPensumProps) {
  const [nombre, setNombre] = useState("");
  const [semestre, setSemestre] = useState<number | "">("");
  const [creditosMax, setCreditosMax] = useState<number | "">("");

  function handleNombre(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setNombre(v);
    onFilter(filtrarMaterias(materias, v, semestre, creditosMax));
  }

  function handleSemestre(e: React.ChangeEvent<HTMLSelectElement>) {
    const v = e.target.value ? Number(e.target.value) : "";
    setSemestre(v);
    onFilter(filtrarMaterias(materias, nombre, v, creditosMax));
  }

  function handleCreditos(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value ? Number(e.target.value) : "";
    setCreditosMax(v);
    onFilter(filtrarMaterias(materias, nombre, semestre, v));
  }

  const semestreOptions = Array.from({ length: 10 }, (_, i) => i + 1);

  return (
    <div className="flex flex-col md:flex-row md:items-end gap-3 mb-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="filtro-nombre" className="text-sm text-muted font-medium">Nombre</label>
        <input
          id="filtro-nombre"
          type="text"
          placeholder="Buscar materia..."
          value={nombre}
          onChange={handleNombre}
          className="px-3 py-2 border border-border rounded-md bg-surface text-text w-full md:min-w-40"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="filtro-semestre" className="text-sm text-muted font-medium">Semestre</label>
        <select
          id="filtro-semestre"
          value={semestre}
          onChange={handleSemestre}
          className="px-3 py-2 border border-border rounded-md bg-surface text-text w-full md:min-w-40"
        >
          <option value="">Todos</option>
          {semestreOptions.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="filtro-creditos" className="text-sm text-muted font-medium">Créditos máx.</label>
        <input
          id="filtro-creditos"
          type="number"
          min={1}
          placeholder="Sin límite"
          value={creditosMax}
          onChange={handleCreditos}
          className="px-3 py-2 border border-border rounded-md bg-surface text-text w-full md:min-w-30"
        />
      </div>
    </div>
  );
}
