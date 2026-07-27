import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./features/auth/hooks/useAuth.tsx";
import LoginForm from "./features/auth/components/LoginForm.tsx";
import RegisterForm from "./features/auth/components/RegisterForm.tsx";
import type { Pensum } from "./features/pensum/types.ts";
import type { Materia } from "./features/pensum/types.ts";
import { PensumService } from "./features/pensum/services/PensumService.ts";
import { useHorarioStore } from "./features/horario/store/horarioStore.ts";
import { HorarioService } from "./features/horario/services/HorarioService.ts";
import type { Horario } from "./features/horario/types.ts";
import CargarPensum from "./features/pensum/components/CargarPensum.tsx";
import FiltroPensum from "./features/pensum/components/FiltroPensum.tsx";
import PoolMaterias from "./features/pensum/components/PoolMaterias.tsx";
import HorarioPage from "./features/horario/components/HorarioPage.tsx";

import NavBar from "./shared/components/NavBar.tsx";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ textAlign: "center", padding: "2rem" }}>Cargando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <><NavBar />{children}</>;
}

function DashboardPage() {
  const navigate = useNavigate();
  const [pensum, setPensum] = useState<Pensum | null>(null);
  const [pensums, setPensums] = useState<Pensum[]>([]);
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [filtradas, setFiltradas] = useState<Materia[]>([]);
  const [syncDone, setSyncDone] = useState(false);
  const [showCrear, setShowCrear] = useState(false);
  const [crearParams, setCrearParams] = useState({ pensumId: "", semestreLabel: "2026-2", maxCreditos: 18, unidadHoraMinutos: 50 });
  const [crearError, setCrearError] = useState<string | null>(null);
  const [creando, setCreando] = useState(false);

  useEffect(() => {
    Promise.all([
      PensumService.list().catch(() => ({ pensums: [] as Pensum[] })),
      HorarioService.list().catch(() => ({ horarios: [] as Horario[] })),
    ]).then(([pRes, hRes]) => {
      setPensums(pRes.pensums);
      setHorarios(hRes.horarios);
      if (pRes.pensums.length > 0) {
        const p = pRes.pensums[0];
        setPensum(p);
        PensumService.storage.save(p);
        setCrearParams((prev) => ({ ...prev, pensumId: p.id }));
      } else {
        PensumService.storage.remove();
      }
    }).catch(() => {
      const local = PensumService.storage.get();
      if (local) setPensum(local);
    }).finally(() => setSyncDone(true));
  }, []);

  useEffect(() => {
    if (pensum) setFiltradas(pensum.materias.filter((m) => m.estado !== "cursado"));
  }, [pensum]);

  function handlePensumLoaded(p: Pensum) {
    setPensum(p);
    setPensums((prev) => { const exists = prev.find((x) => x.id === p.id); return exists ? prev.map((x) => x.id === p.id ? p : x) : [...prev, p]; });
  }

  function handleCargarNuevo() {
    PensumService.storage.remove();
    setPensum(null);
    setFiltradas([]);
    useHorarioStore.getState().clear();
  }

  async function handleCrearHorario() {
    if (!crearParams.pensumId) return;
    setCrearError(null);
    setCreando(true);
    try {
      const { horario } = await HorarioService.create(
        crearParams.pensumId, crearParams.semestreLabel,
        crearParams.maxCreditos, crearParams.unidadHoraMinutos,
      );
      useHorarioStore.getState().initHorarioReal(horario);
      navigate(`/horario/${horario.id}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error al crear horario";
      setCrearError(msg);
      setCreando(false);
    }
  }

  if (!syncDone) return <div style={{ textAlign: "center", padding: "2rem", color: "var(--color-text-muted)" }}>Cargando...</div>;

  const pensumActual = pensum;
  const materiasDisponibles = pensumActual
    ? pensumActual.materias.filter((m) => m.estado !== "cursado")
    : [];

  return (
    <div style={{ maxWidth: 1060, margin: "0 auto", padding: "2rem 1rem" }}>
      <div style={{ display: "flex", gap: "var(--spacing-4)", marginBottom: "var(--spacing-6)" }}>
        {/* Pensums section */}
        <div style={{ flex: 7, minWidth: 0 }}>
          <section>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--spacing-3)" }}>
              <h2 style={{ margin: 0, fontSize: "var(--font-size-lg)" }}>Pensums</h2>
              {pensums.length > 0 && (
                <button type="button" onClick={() => setShowCrear(!showCrear)} style={{
                  padding: "0.4rem 1rem", background: "var(--color-primary)", color: "#fff",
                  border: "none", borderRadius: "var(--radius-md)", cursor: "pointer", fontWeight: 600, fontSize: "var(--font-size-sm)",
                }}>
                  {showCrear ? "Cancelar" : "Crear horario"}
                </button>
              )}
            </div>

            {pensums.length === 0 ? (
              <CargarPensum onPensumLoaded={handlePensumLoaded} />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-2)" }}>
                {pensums.map((p) => (
                  <div key={p.id} onClick={() => setPensum(p)} style={{
                    padding: "var(--spacing-3)", borderRadius: "var(--radius-md)", cursor: "pointer",
                    border: `1px solid ${pensumActual?.id === p.id ? "var(--color-primary)" : "var(--color-border)"}`,
                    background: pensumActual?.id === p.id ? "var(--color-primary-muted, #dbeafe)" : "var(--color-surface)",
                    transition: "all 0.15s",
                  }}>
                    <div style={{ fontWeight: 600, fontSize: "var(--font-size-sm)" }}>{p.nombre}</div>
                    <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>
                      {p.materias.length} materias
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Crear horario form */}
            {showCrear && pensums.length > 0 && (
              <div style={{ marginTop: "var(--spacing-4)", padding: "var(--spacing-4)", background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)" }}>
                <h3 style={{ fontSize: "var(--font-size-sm)", marginBottom: "var(--spacing-3)" }}>Configurar nuevo horario</h3>
                {crearError && <div style={{ padding: "var(--spacing-2)", background: "#fef2f2", border: "1px solid #ef4444", borderRadius: "var(--radius-sm)", marginBottom: "var(--spacing-2)", fontSize: "var(--font-size-xs)", color: "#ef4444" }}>{crearError}</div>}
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-3)" }}>
                  <div>
                    <label style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", fontWeight: 500 }}>Pensum</label>
                    <select value={crearParams.pensumId} onChange={(e) => setCrearParams((p) => ({ ...p, pensumId: e.target.value }))} style={{
                      width: "100%", padding: "var(--spacing-2)", border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-md)", background: "var(--color-surface)", color: "var(--color-text)",
                    }}>
                      {pensums.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                    </select>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--spacing-3)" }}>
                    <div>
                      <label style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", fontWeight: 500 }}>Semestre</label>
                      <input type="text" value={crearParams.semestreLabel} onChange={(e) => setCrearParams((p) => ({ ...p, semestreLabel: e.target.value }))} style={{
                        width: "100%", padding: "var(--spacing-2)", border: "1px solid var(--color-border)",
                        borderRadius: "var(--radius-md)", background: "var(--color-surface)", color: "var(--color-text)",
                      }} />
                    </div>
                    <div>
                      <label style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", fontWeight: 500 }}>Créd. máx</label>
                      <input type="number" min={1} value={crearParams.maxCreditos} onChange={(e) => setCrearParams((p) => ({ ...p, maxCreditos: Number(e.target.value) }))} style={{
                        width: "100%", padding: "var(--spacing-2)", border: "1px solid var(--color-border)",
                        borderRadius: "var(--radius-md)", background: "var(--color-surface)", color: "var(--color-text)",
                      }} />
                    </div>
                    <div>
                      <label style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", fontWeight: 500 }}>Unidad (min)</label>
                      <input type="number" min={10} max={120} step={5} value={crearParams.unidadHoraMinutos} onChange={(e) => setCrearParams((p) => ({ ...p, unidadHoraMinutos: Number(e.target.value) }))} style={{
                        width: "100%", padding: "var(--spacing-2)", border: "1px solid var(--color-border)",
                        borderRadius: "var(--radius-md)", background: "var(--color-surface)", color: "var(--color-text)",
                      }} />
                    </div>
                  </div>
              <button type="button" onClick={handleCrearHorario} disabled={creando} style={{
                padding: "var(--spacing-2) var(--spacing-4)", background: creando ? "var(--color-muted-block)" : "var(--color-primary)",
                color: "#fff", border: "none", borderRadius: "var(--radius-md)", cursor: creando ? "not-allowed" : "pointer", fontWeight: 600,
              }}>
                {creando ? "Preparando..." : "Ir al horario"}
              </button>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Horarios section */}
        <div style={{ flex: 3, minWidth: 0 }}>
          <section>
            <h2 style={{ margin: 0, marginBottom: "var(--spacing-3)", fontSize: "var(--font-size-lg)" }}>Mis horarios</h2>
            {horarios.length === 0 ? (
              <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)", textAlign: "center", padding: "var(--spacing-4)" }}>
                No hay horarios aún. Carga un pensum y crea tu primer horario.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-2)" }}>
                {horarios.map((h) => (
                  <div key={h.id} onClick={() => navigate(`/horario/${h.id}`)} style={{
                    padding: "var(--spacing-3)", borderRadius: "var(--radius-md)", cursor: "pointer",
                    border: "1px solid var(--color-border)", background: "var(--color-surface)", transition: "all 0.15s",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "var(--font-size-sm)" }}>{h.semestreLabel}</div>
                      <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>
                        {h.bloques.length} bloque{h.bloques.length !== 1 ? "s" : ""} · {h.estado === "finalizado" ? "Finalizado" : "En progreso"}
                      </div>
                    </div>
                    <span style={{
                      fontSize: "var(--font-size-xs)", padding: "2px 8px", borderRadius: "var(--radius-sm)",
                      background: h.estado === "finalizado" ? "#f3f4f6" : "#dcfce7",
                      color: h.estado === "finalizado" ? "#6b7280" : "#166534", fontWeight: 600,
                    }}>
                      {h.estado === "finalizado" ? "Finalizado" : "Activo"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Pensum detail */}
      {pensumActual && (
        <section style={{ marginBottom: "var(--spacing-6)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--spacing-3)" }}>
            <h2 style={{ margin: 0, fontSize: "var(--font-size-lg)" }}>{pensumActual.nombre}</h2>
            <button type="button" onClick={handleCargarNuevo} style={{
              padding: "0.3rem 0.8rem", background: "transparent", color: "var(--color-text-muted)",
              border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", cursor: "pointer", fontSize: "var(--font-size-xs)",
            }}>Cargar nuevo pensum</button>
          </div>
          <FiltroPensum materias={materiasDisponibles} onFilter={setFiltradas} />
          <PoolMaterias materias={filtradas} />
        </section>
      )}
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginForm />} />
      <Route path="/register" element={<RegisterForm />} />
      <Route path="/horario/:id" element={<ProtectedRoute><HorarioPage /></ProtectedRoute>} />
      <Route path="/horario/nuevo" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
