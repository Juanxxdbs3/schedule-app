import { useState, useCallback, useMemo } from "react";
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
  const [pensum, setPensum] = useState<Pensum | null>(() => PensumService.storage.get());
  const [filtradas, setFiltradas] = useState<Materia[]>([]);

  const handlePensumLoaded = useCallback((p: Pensum) => {
    setPensum(p);
    setFiltradas(p.materias.filter((m) => m.estado !== "cursado"));
  }, []);

  const handleCargarNuevo = useCallback(() => {
    PensumService.storage.remove();
    setPensum(null);
    setFiltradas([]);
  }, []);

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

  const materiasDisponibles = useMemo(
    () => pensum.materias.filter((m) => m.estado !== "cursado"),
    [pensum],
  );
  const materiasMostrar = filtradas.length > 0 ? filtradas : materiasDisponibles;

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
        <PoolMaterias materias={materiasMostrar} />
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
