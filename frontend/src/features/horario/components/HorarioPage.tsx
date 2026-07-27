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
    return <div style={{ textAlign: "center", padding: "2rem", color: "var(--color-text-muted)" }}>{loading ? "Cargando..." : "Horario no encontrado"}</div>;
  }

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "2rem 1rem" }}>
      <main>
        <HorarioScreen modo={modo} horario={storeHorario} pensum={pensum} onModoChange={handleModoChange} />
      </main>

      {modo === "edicion" && (
        <div style={{ position: "fixed", bottom: "var(--spacing-4)", right: "var(--spacing-4)", zIndex: 50, display: "flex", gap: "var(--spacing-2)" }}>
          <button type="button" onClick={handleEliminar} disabled={loading || deleting} style={{
            padding: "0.7rem 1.5rem", background: "transparent",
            color: "#ef4444", border: "1px solid #ef4444",
            borderRadius: "var(--radius-lg)", cursor: loading || deleting ? "not-allowed" : "pointer",
            fontWeight: 600, fontSize: "var(--font-size-md)", opacity: loading || deleting ? 0.6 : 1,
          }}>
            {deleting ? "Eliminando..." : "Eliminar horario"}
          </button>
          <button type="button" onClick={handleGuardar} disabled={loading} style={{
            padding: "0.7rem 2rem", background: loading ? "var(--color-muted-block)" : "var(--color-primary)",
            color: "#fff", border: "none", borderRadius: "var(--radius-lg)", cursor: loading ? "not-allowed" : "pointer",
            fontWeight: 600, fontSize: "var(--font-size-md)", boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}>
            {loading ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      )}
      {modo === "curso" && (
        <div style={{ position: "fixed", bottom: "var(--spacing-4)", right: "var(--spacing-4)", zIndex: 50 }}>
          <button type="button" onClick={handleEditar} style={{
            padding: "0.7rem 2rem", background: "transparent",
            color: "var(--color-text)", border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg)", cursor: "pointer", fontWeight: 500,
            fontSize: "var(--font-size-md)", boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          }}>
            Editar horario
          </button>
        </div>
      )}
    </div>
  );
}
