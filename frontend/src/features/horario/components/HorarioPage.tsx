import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useHorarioStore } from "../store/horarioStore.ts";
import { PensumService } from "../../pensum/services/PensumService.ts";
import type { Pensum } from "../../pensum/types.ts";
import type { ModoHorario } from "../types.ts";
import HorarioScreen from "./HorarioScreen.tsx";

export default function HorarioPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const navigate = useNavigate();
  const location = useLocation();
  const storeHorario = useHorarioStore((s) => s.horario);
  const fetchById = useHorarioStore((s) => s.fetchById);
  const saveNuevoHorario = useHorarioStore((s) => s.saveNuevoHorario);
  const saveBloques = useHorarioStore((s) => s.saveBloques);
  const initNuevoHorario = useHorarioStore((s) => s.initNuevoHorario);
  const loading = useHorarioStore((s) => s.loading);

  const [pensum, setPensum] = useState<Pensum | null>(null);
  const [modo, setModo] = useState<ModoHorario>("edicion");
  const [ready, setReady] = useState(false);
  const esNuevo = !id || id === "nuevo";

  useEffect(() => {
    if (!id) return;
    setReady(false);
    setPensum(null);
    const state = location.state as Record<string, unknown> | null;

    if (esNuevo && state) {
      const h = initNuevoHorario(
        state.pensumId as string,
        state.semestreLabel as string,
        state.maxCreditos as number,
        state.unidadHoraMinutos as number,
      );
      PensumService.getById(h.pensumId)
        .then((res) => { setPensum(res.pensum); setReady(true); })
        .catch(() => setReady(true));
    } else if (!esNuevo) {
      fetchById(id);
    }
  }, [id]);

  useEffect(() => {
    if (!storeHorario || !id || esNuevo) return;
    if (storeHorario.id !== id) return;
    PensumService.getById(storeHorario.pensumId)
      .then((res) => { setPensum(res.pensum); setModo(storeHorario.estado === "finalizado" ? "finalizado" : "edicion"); setReady(true); })
      .catch(() => setReady(true));
  }, [storeHorario, id]);

  async function handleGuardar() {
    try {
      if (esNuevo) {
        const creado = await saveNuevoHorario();
        setModo("curso");
        navigate(`/horario/${creado.id}`, { replace: true });
      } else {
        await saveBloques();
        setModo("curso");
      }
    } catch {}
  }

  function handleEditar() { setModo("edicion"); }

  if (loading || !ready || !storeHorario || !pensum) {
    return <div style={{ textAlign: "center", padding: "2rem", color: "var(--color-text-muted)" }}>{loading ? "Cargando..." : "Horario no encontrado"}</div>;
  }

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "2rem 1rem" }}>
      <main>
        <HorarioScreen modo={modo} horario={storeHorario} pensum={pensum} onModoChange={setModo} />
      </main>

      {modo === "edicion" && (
        <div style={{ position: "fixed", bottom: "var(--spacing-4)", right: "var(--spacing-4)", zIndex: 50 }}>
          <button type="button" onClick={handleGuardar} disabled={loading} style={{
            padding: "0.7rem 2rem", background: loading ? "var(--color-muted-block)" : "var(--color-primary)",
            color: "#fff", border: "none", borderRadius: "var(--radius-lg)", cursor: loading ? "not-allowed" : "pointer",
            fontWeight: 600, fontSize: "var(--font-size-md)", boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}>
            {loading ? "Guardando..." : esNuevo ? "Guardar horario" : "Guardar cambios"}
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
