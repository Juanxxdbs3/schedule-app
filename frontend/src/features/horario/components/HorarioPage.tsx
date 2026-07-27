import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useHorarioStore } from "../store/horarioStore.ts";
import { HorarioService } from "../services/HorarioService.ts";
import { PensumService } from "../../pensum/services/PensumService.ts";
import type { Pensum } from "../../pensum/types.ts";
import type { ModoHorario } from "../types.ts";
import HorarioScreen from "./HorarioScreen.tsx";

export default function HorarioPage() {
  const params = useParams<{ id: string }>();
  const id = params.id!;
  const navigate = useNavigate();
  const storeHorario = useHorarioStore((s) => s.horario);
  const fetchById = useHorarioStore((s) => s.fetchById);
  const saveBloques = useHorarioStore((s) => s.saveBloques);
  const clear = useHorarioStore((s) => s.clear);
  const loading = useHorarioStore((s) => s.loading);

  const [pensum, setPensum] = useState<Pensum | null>(null);
  const [modo, setModo] = useState<ModoHorario>("edicion");
  const [ready, setReady] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setReady(false);
    setPensum(null);
    fetchById(id);
  }, [id]);

  useEffect(() => {
    if (!storeHorario || storeHorario.id !== id) return;
    PensumService.getById(storeHorario.pensumId)
      .then((res) => { setPensum(res.pensum); setModo(storeHorario.estado === "finalizado" ? "finalizado" : "edicion"); setReady(true); })
      .catch(() => setReady(true));
  }, [storeHorario, id]);

  async function handleGuardar() {
    try {
      await saveBloques();
      const { pensum: p } = await PensumService.getById(pensum!.id);
      setPensum(p);
      setModo("curso");
    } catch {}
  }

  async function handleEliminar() {
    if (!window.confirm("¿Eliminar este horario permanentemente?")) return;
    setDeleting(true);
    try {
      await HorarioService.delete(id);
      clear();
      navigate("/dashboard", { replace: true });
    } catch {
      setDeleting(false);
    }
  }

  function handleEditar() { setModo("edicion"); }

  function handleModoChange(nuevoModo: ModoHorario) {
    if (nuevoModo === "finalizado") {
      useHorarioStore.getState().finalizar().catch(() => {});
    }
    setModo(nuevoModo);
  }

  if (loading || !ready || !storeHorario || !pensum) {
    return <div className="text-center p-8 text-muted">{loading ? "Cargando..." : "Horario no encontrado"}</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-8">
      <main>
        <HorarioScreen
          modo={modo}
          horario={storeHorario}
          pensum={pensum}
          onModoChange={handleModoChange}
          onGuardar={modo === "edicion" ? handleGuardar : undefined}
          onEliminar={modo === "edicion" ? handleEliminar : undefined}
          guardarLoading={loading}
          eliminando={deleting}
        />
      </main>

      {modo === "curso" && (
        <div className="fixed bottom-4 right-4 z-50">
          <button type="button" onClick={handleEditar} className="px-8 py-2.5 bg-transparent text-text border border-border rounded-lg cursor-pointer font-medium text-md shadow-md">
            Editar horario
          </button>
        </div>
      )}
    </div>
  );
}
