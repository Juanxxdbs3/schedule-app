import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./features/auth/hooks/useAuth.tsx";
import LoginForm from "./features/auth/components/LoginForm.tsx";
import RegisterForm from "./features/auth/components/RegisterForm.tsx";
import type { Pensum } from "./features/pensum/types.ts";
import type { Materia } from "./features/pensum/types.ts";
import { PensumService } from "./features/pensum/services/PensumService.ts";
import { useHorarioStore } from "./features/horario/store/horarioStore.ts";
import CargarPensum from "./features/pensum/components/CargarPensum.tsx";
import FiltroPensum from "./features/pensum/components/FiltroPensum.tsx";
import PoolMaterias from "./features/pensum/components/PoolMaterias.tsx";
import HorarioPage from "./features/horario/components/HorarioPage.tsx";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ textAlign: "center", padding: "2rem" }}>Cargando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PensumDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [pensum, setPensum] = useState<Pensum | null>(null);
  const [filtradas, setFiltradas] = useState<Materia[]>([]);
  const [syncDone, setSyncDone] = useState(false);
  const fetchHorarios = useHorarioStore((s) => s.fetchHorarios);
  const createHorario = useHorarioStore((s) => s.createHorario);
  const storeHorario = useHorarioStore((s) => s.horario);
  const creatingHorario = useHorarioStore((s) => s.loading);
  const [showConfig, setShowConfig] = useState(false);

  useEffect(() => {
    PensumService.list()
      .then((res) => {
        if (res.pensums.length > 0) {
          const p = res.pensums[0];
          setPensum(p);
          PensumService.storage.save(p);
          return p.id;
        } else {
          PensumService.storage.remove();
          return null;
        }
      })
      .catch(() => {
        const local = PensumService.storage.get();
        if (local) setPensum(local);
        return local?.id ?? null;
      })
      .then((pensumId) => {
        if (pensumId) return fetchHorarios(pensumId);
      })
      .finally(() => setSyncDone(true));
  }, []);

  useEffect(() => {
    if (pensum) {
      const visibles = pensum.materias.filter((m) => m.estado !== "cursado");
      setFiltradas(visibles);
    }
  }, [pensum]);

  useEffect(() => {
    if (storeHorario && storeHorario.estado === "en_progreso") {
      navigate(`/horario/${storeHorario.id}`);
    }
  }, [storeHorario]);

  function handlePensumLoaded(p: Pensum) {
    setPensum(p);
    fetchHorarios(p.id);
  }

  function handleCargarNuevo() {
    PensumService.storage.remove();
    setPensum(null);
    setFiltradas([]);
    useHorarioStore.getState().clear();
  }

  async function handleCrearHorario(params: { semestreLabel: string; maxCreditos: number; unidadHoraMinutos: number }) {
    if (!pensum) return;
    try {
      await createHorario(pensum.id, params.semestreLabel, params.maxCreditos, params.unidadHoraMinutos);
      setShowConfig(false);
    } catch {}
  }

  if (!syncDone) {
    return <div style={{ textAlign: "center", padding: "2rem", color: "var(--color-text-muted)" }}>Cargando...</div>;
  }

  if (!pensum) {
    return (
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "2rem 1rem" }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--spacing-4)" }}>
          <h1>Horario App</h1>
          <div>
            <span style={{ marginRight: "1rem", color: "var(--color-text-muted)" }}>{user?.username}</span>
            <button type="button" onClick={logout} style={{
              padding: "0.4rem 1rem", background: "var(--color-primary)", color: "#fff",
              border: "none", borderRadius: "var(--radius-md)", cursor: "pointer",
            }}>Cerrar sesión</button>
          </div>
        </header>
        <main>
          <CargarPensum onPensumLoaded={handlePensumLoaded} />
        </main>
      </div>
    );
  }

  const materiasDisponibles = pensum.materias.filter((m) => m.estado !== "cursado");

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "2rem 1rem" }}>
      <header style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: "var(--spacing-4)", flexWrap: "wrap", gap: "var(--spacing-2)",
      }}>
        <div>
          <h1 style={{ margin: 0 }}>Horario App</h1>
          <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)", margin: 0 }}>{pensum.nombre}</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-3)" }}>
          <span style={{ color: "var(--color-text-muted)", fontSize: "var(--font-size-sm)" }}>{user?.username}</span>
          <button type="button" onClick={() => setShowConfig(true)} style={{
            padding: "0.4rem 1rem", background: "var(--color-primary)", color: "#fff",
            border: "none", borderRadius: "var(--radius-md)", cursor: "pointer", fontSize: "var(--font-size-sm)", fontWeight: 600,
          }}>
            Crear horario
          </button>
          <button type="button" onClick={handleCargarNuevo} style={{
            padding: "0.4rem 0.8rem", background: "transparent", color: "var(--color-text-muted)",
            border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", cursor: "pointer", fontSize: "var(--font-size-sm)",
          }}>
            Cargar nuevo pensum
          </button>
          <button type="button" onClick={logout} style={{
            padding: "0.4rem 1rem", background: "var(--color-primary)", color: "#fff",
            border: "none", borderRadius: "var(--radius-md)", cursor: "pointer",
          }}>Cerrar sesión</button>
        </div>
      </header>

      {showConfig ? (
        <div style={{ maxWidth: 480, margin: "0 auto" }}>
          <h2 style={{ marginBottom: "var(--spacing-4)" }}>Configurar horario</h2>
          <ConfigForm onSubmit={handleCrearHorario} loading={creatingHorario} onCancel={() => setShowConfig(false)} />
        </div>
      ) : (
        <main>
          <FiltroPensum materias={materiasDisponibles} onFilter={setFiltradas} />
          <PoolMaterias materias={filtradas} />
        </main>
      )}
    </div>
  );
}

function ConfigForm({ onSubmit, loading, onCancel }: {
  onSubmit: (p: { semestreLabel: string; maxCreditos: number; unidadHoraMinutos: number }) => void;
  loading: boolean;
  onCancel: () => void;
}) {
  const [semestreLabel, setSemestreLabel] = useState("2026-2");
  const [maxCreditos, setMaxCreditos] = useState(18);
  const [unidadHoraMinutos, setUnidadHoraMinutos] = useState(50);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({ semestreLabel: semestreLabel.trim(), maxCreditos, unidadHoraMinutos });
  }

  const fieldStyle: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "var(--spacing-1)" };
  const labelStyle: React.CSSProperties = { fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)", fontWeight: 500 };
  const inputStyle: React.CSSProperties = {
    padding: "var(--spacing-2) var(--spacing-3)", border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-md)", background: "var(--color-surface)", color: "var(--color-text)",
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-4)" }}>
      <div style={fieldStyle}>
        <label htmlFor="sl" style={labelStyle}>Etiqueta del semestre</label>
        <input id="sl" type="text" value={semestreLabel} onChange={(e) => setSemestreLabel(e.target.value)} style={inputStyle} required />
      </div>
      <div style={fieldStyle}>
        <label htmlFor="mc" style={labelStyle}>Créditos máximos</label>
        <input id="mc" type="number" min={1} value={maxCreditos} onChange={(e) => setMaxCreditos(Number(e.target.value))} style={inputStyle} required />
      </div>
      <div style={fieldStyle}>
        <label htmlFor="uh" style={labelStyle}>Unidad de hora (minutos)</label>
        <input id="uh" type="number" min={10} max={120} step={5} value={unidadHoraMinutos} onChange={(e) => setUnidadHoraMinutos(Number(e.target.value))} style={inputStyle} required />
      </div>
      <div style={{ display: "flex", gap: "var(--spacing-3)" }}>
        <button type="button" onClick={onCancel} style={{
          flex: 1, padding: "var(--spacing-3)", background: "transparent", color: "var(--color-text-muted)",
          border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", cursor: "pointer",
        }}>Cancelar</button>
        <button type="submit" disabled={loading} style={{
          flex: 1, padding: "var(--spacing-3)", background: loading ? "var(--color-muted-block)" : "var(--color-primary)",
          color: "#fff", border: "none", borderRadius: "var(--radius-md)", cursor: loading ? "not-allowed" : "pointer", fontWeight: 600,
        }}>{loading ? "Creando..." : "Crear horario"}</button>
      </div>
    </form>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginForm />} />
      <Route path="/register" element={<RegisterForm />} />
      <Route
        path="/horario/:id"
        element={
          <ProtectedRoute>
            <HorarioPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <PensumDashboard />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
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
