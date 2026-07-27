import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./features/auth/hooks/useAuth.tsx";
import LoginForm from "./features/auth/components/LoginForm.tsx";
import RegisterForm from "./features/auth/components/RegisterForm.tsx";
import type { Pensum } from "./features/pensum/types.ts";
import type { Materia } from "./features/pensum/types.ts";
import { PensumService } from "./features/pensum/services/PensumService.ts";
import CargarPensum from "./features/pensum/components/CargarPensum.tsx";
import FiltroPensum from "./features/pensum/components/FiltroPensum.tsx";
import PoolMaterias from "./features/pensum/components/PoolMaterias.tsx";
import { useHorarioStore } from "./features/horario/store/horarioStore.ts";
import ConfigurarHorario from "./features/horario/components/ConfigurarHorario.tsx";
import HorarioScreen from "./features/horario/components/HorarioScreen.tsx";
import FinalizarHorario from "./features/horario/components/FinalizarHorario.tsx";

type Screen = "pensum" | "config" | "horario" | "finalizar";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ textAlign: "center", padding: "2rem" }}>Cargando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function PensumDashboard() {
  const { user, logout } = useAuth();
  const [pensum, setPensum] = useState<Pensum | null>(null);
  const [filtradas, setFiltradas] = useState<Materia[]>([]);
  const [syncDone, setSyncDone] = useState(false);
  const [screen, setScreen] = useState<Screen>("pensum");
  const horario = useHorarioStore((s) => s.horario);
  const fetchHorarios = useHorarioStore((s) => s.fetchHorarios);
  const createHorario = useHorarioStore((s) => s.createHorario);
  const marcarResultado = useHorarioStore((s) => s.marcarResultado);
  const finalizar = useHorarioStore((s) => s.finalizar);
  const clearHorario = useHorarioStore((s) => s.clear);
  const creatingHorario = useHorarioStore((s) => s.loading);

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
        if (pensumId) {
          return fetchHorarios(pensumId);
        }
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
    if (horario && horario.estado === "en_progreso") {
      setScreen("horario");
    }
  }, [horario]);

  function handlePensumLoaded(p: Pensum) {
    setPensum(p);
    fetchHorarios(p.id);
  }

  function handleCargarNuevo() {
    PensumService.storage.remove();
    setPensum(null);
    setFiltradas([]);
    clearHorario();
    setScreen("pensum");
  }

  async function handleCrearHorario(params: { semestreLabel: string; maxCreditos: number; unidadHoraMinutos: number }) {
    if (!pensum) return;
    try {
      await createHorario(pensum.id, params.semestreLabel, params.maxCreditos, params.unidadHoraMinutos);
      setScreen("horario");
    } catch {
      // error is set in store
    }
  }

  async function handleMarcarResultado(codigo: string, aprobada: boolean) {
    const h = useHorarioStore.getState().horario;
    if (!h) return;
    await marcarResultado(codigo, aprobada);
  }

  async function handleCerrarSemestre() {
    const h = useHorarioStore.getState().horario;
    if (!h) return;
    await finalizar();
    setScreen("pensum");
    const refreshed = await PensumService.list().catch(() => null);
    if (refreshed && refreshed.pensums.length > 0) {
      setPensum(refreshed.pensums[0]);
      PensumService.storage.save(refreshed.pensums[0]);
    }
  }

  function handleVolverAPensum() {
    setScreen("pensum");
  }

  const bloquesActuales = horario?.bloques ?? [];

  if (!syncDone) {
    return <div style={{ textAlign: "center", padding: "2rem", color: "var(--color-text-muted)" }}>Cargando...</div>;
  }

  if (!pensum) {
    return (
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "2rem 1rem" }}>
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "var(--spacing-4)",
          }}
        >
          <h1>Horario App</h1>
          <div>
            <span style={{ marginRight: "1rem", color: "var(--color-text-muted)" }}>
              {user?.username}
            </span>
            <button
              type="button"
              onClick={logout}
              style={{
                padding: "0.4rem 1rem",
                background: "var(--color-primary)",
                color: "#fff",
                border: "none",
                borderRadius: "var(--radius-md)",
                cursor: "pointer",
              }}
            >
              Cerrar sesión
            </button>
          </div>
        </header>
        <main>
          <CargarPensum onPensumLoaded={handlePensumLoaded} />
        </main>
      </div>
    );
  }

  if (screen === "config") {
    return (
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "2rem 1rem" }}>
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "var(--spacing-4)",
          }}
        >
          <div>
            <h1 style={{ margin: 0 }}>Horario App</h1>
            <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)", margin: 0 }}>
              {pensum.nombre}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setScreen("pensum")}
            style={{
              padding: "0.4rem 0.8rem",
              background: "transparent",
              color: "var(--color-text-muted)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              cursor: "pointer",
              fontSize: "var(--font-size-sm)",
            }}
          >
            Cancelar
          </button>
        </header>
        <ConfigurarHorario onSubmit={handleCrearHorario} loading={creatingHorario} />
      </div>
    );
  }

  if (screen === "horario" || screen === "finalizar") {
    const materiasDisponibles = pensum.materias.filter((m) => m.estado !== "cursado");

    if (screen === "finalizar") {
      return (
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "2rem 1rem" }}>
          <FinalizarHorario
            bloques={bloquesActuales}
            materias={materiasDisponibles}
            onMarcar={handleMarcarResultado}
            onCerrar={handleCerrarSemestre}
            onCancelar={() => setScreen("horario")}
          />
        </div>
      );
    }

    return (
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "2rem 1rem" }}>
        <HorarioScreen
          materias={materiasDisponibles}
          onVolver={handleVolverAPensum}
          onFinalizar={() => setScreen("finalizar")}
        />
      </div>
    );
  }

  const materiasDisponibles = pensum.materias.filter((m) => m.estado !== "cursado");

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "2rem 1rem" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "var(--spacing-4)",
          flexWrap: "wrap",
          gap: "var(--spacing-2)",
        }}
      >
        <div>
          <h1 style={{ margin: 0 }}>Horario App</h1>
          <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)", margin: 0 }}>
            {pensum.nombre}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-3)" }}>
          <span style={{ color: "var(--color-text-muted)", fontSize: "var(--font-size-sm)" }}>
            {user?.username}
          </span>
          <button
            type="button"
            onClick={() => setScreen("config")}
            style={{
              padding: "0.4rem 1rem",
              background: "var(--color-primary)",
              color: "#fff",
              border: "none",
              borderRadius: "var(--radius-md)",
              cursor: "pointer",
              fontSize: "var(--font-size-sm)",
              fontWeight: 600,
            }}
          >
            Crear horario
          </button>
          <button
            type="button"
            onClick={handleCargarNuevo}
            style={{
              padding: "0.4rem 0.8rem",
              background: "transparent",
              color: "var(--color-text-muted)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              cursor: "pointer",
              fontSize: "var(--font-size-sm)",
            }}
          >
            Cargar nuevo pensum
          </button>
          <button
            type="button"
            onClick={logout}
            style={{
              padding: "0.4rem 1rem",
              background: "var(--color-primary)",
              color: "#fff",
              border: "none",
              borderRadius: "var(--radius-md)",
              cursor: "pointer",
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <main>
        <FiltroPensum materias={materiasDisponibles} onFilter={setFiltradas} />
        <PoolMaterias materias={filtradas} />
      </main>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginForm />} />
      <Route path="/register" element={<RegisterForm />} />
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
