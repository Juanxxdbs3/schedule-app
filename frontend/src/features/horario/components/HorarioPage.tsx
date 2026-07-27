import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/hooks/useAuth.tsx";
import { useHorarioStore } from "../store/horarioStore.ts";
import { PensumService } from "../../pensum/services/PensumService.ts";
import type { Pensum } from "../../pensum/types.ts";
import type { ModoHorario } from "../types.ts";
import HorarioScreen from "./HorarioScreen.tsx";

export default function HorarioPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const storeHorario = useHorarioStore((s) => s.horario);
  const fetchById = useHorarioStore((s) => s.fetchById);
  const saveBloques = useHorarioStore((s) => s.saveBloques);
  const loading = useHorarioStore((s) => s.loading);

  const [pensum, setPensum] = useState<Pensum | null>(null);
  const [modo, setModo] = useState<ModoHorario>("edicion");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!id) return;
    setReady(false);
    setPensum(null);
    fetchById(id);
  }, [id]);

  useEffect(() => {
    if (!storeHorario || !id || storeHorario.id !== id) return;
    PensumService.getById(storeHorario.pensumId)
      .then((res) => {
        setPensum(res.pensum);
        setModo(storeHorario.estado === "finalizado" ? "finalizado" : "edicion");
        setReady(true);
      })
      .catch(() => setReady(true));
  }, [storeHorario, id]);

  async function handleGuardarHorario() {
    try {
      await saveBloques();
      setModo("curso");
    } catch {}
  }

  async function handleEditarHorario() {
    if (!id) return;
    setModo("edicion");
  }

  if (loading || !ready || !storeHorario || !pensum) {
    return (
      <div style={{ textAlign: "center", padding: "2rem", color: "var(--color-text-muted)" }}>
        {loading ? "Cargando..." : "Horario no encontrado"}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "2rem 1rem" }}>
      <header
        style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginBottom: "var(--spacing-4)", flexWrap: "wrap", gap: "var(--spacing-2)",
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: "var(--font-size-lg)" }}>{storeHorario.semestreLabel}</h1>
          <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)", margin: 0 }}>{pensum.nombre}</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-3)" }}>
          {modo === "edicion" && (
            <button type="button" onClick={handleGuardarHorario} disabled={loading} style={{
              padding: "0.5rem 1.2rem", background: loading ? "var(--color-muted-block)" : "var(--color-primary)",
              color: "#fff", border: "none", borderRadius: "var(--radius-md)",
              cursor: loading ? "not-allowed" : "pointer", fontWeight: 600, fontSize: "var(--font-size-sm)",
            }}>
              {loading ? "Guardando..." : "Guardar horario"}
            </button>
          )}
          {modo === "curso" && (
            <button type="button" onClick={handleEditarHorario} style={{
              padding: "0.4rem 1rem", background: "transparent", color: "var(--color-text-muted)",
              border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", cursor: "pointer", fontSize: "var(--font-size-sm)",
            }}>
              Editar horario
            </button>
          )}
          <button type="button" onClick={() => navigate("/")} style={{
            padding: "0.4rem 0.8rem", background: "transparent", color: "var(--color-text-muted)",
            border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", cursor: "pointer", fontSize: "var(--font-size-sm)",
          }}>
            Volver al pensum
          </button>
          <span style={{ color: "var(--color-text-muted)", fontSize: "var(--font-size-sm)" }}>{user?.username}</span>
          <button type="button" onClick={logout} style={{
            padding: "0.4rem 1rem", background: "var(--color-primary)", color: "#fff",
            border: "none", borderRadius: "var(--radius-md)", cursor: "pointer",
          }}>Cerrar sesión</button>
        </div>
      </header>

      <main>
        <HorarioScreen
          modo={modo}
          horario={storeHorario}
          pensum={pensum}
          onModoChange={setModo}
        />
      </main>
    </div>
  );
}
